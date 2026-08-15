import { Contract } from "@/modules/contracts/contract.model";
import { AppError } from "@/utils/AppError";
import { notifyUser } from "@/services/notification.service";
import { User } from "@/modules/users/user.model";
import { hashContractText } from "@/utils/contractIntegrity";
import { generateSignedContractPdf } from "@/services/pdf.service";
import { saveSignatureImage } from "@/services/signature.service";
import type {
  CreateContractInput,
  SendContractInput,
  SignContractInput,
  UpdateContractInput,
  RequestChangesInput,
  ReviseContractInput,
} from "@/modules/contracts/contract.validation";
import {
  syncSourceEvent,
  removeSourceEvent,
} from "@/modules/calendar/event.service";
import { isUnderContractLimit } from "@/config/limits";
import { PaywallError } from "@/utils/PaywallError";

export async function getContractsForUser(userId: string) {
  return Contract.find({ $or: [{ creator: userId }, { sentBy: userId }] }).sort(
    {
      createdAt: -1,
    },
  );
}

export async function getContractById(id: string, userId: string) {
  const contract = await Contract.findOne({
    _id: id,
    $or: [{ creator: userId }, { sentBy: userId }],
  });
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }
  return contract;
}

// Kreator sam kreira svoj ugovor
export async function createContract(
  creatorId: string,
  input: CreateContractInput,
) {
  const creatorAccount = await User.findById(creatorId);
  if (creatorAccount) {
    const activeContractCount = await Contract.countDocuments({
      creator: creatorId,
      status: { $nin: ["signed", "declined", "expired"] },
    });

    if (!isUnderContractLimit(creatorAccount.plan, activeContractCount)) {
      throw new PaywallError(
        "You've reached the free plan limit of 2 active contracts. Upgrade to Pro for unlimited contracts.",
      );
    }
  }

  const { dealId, ...rest } = input;
  return Contract.create({
    ...rest,
    creator: creatorId,
    ...(dealId ? { deal: dealId } : {}),
  });
}

// Brend šalje ugovor kreatoru
export async function sendContract(
  brandUserId: string,
  input: SendContractInput,
) {
  const { creatorId, ...rest } = input;

  const creator = await User.findOne({ _id: creatorId, role: "creator" });
  if (!creator) {
    throw new AppError("Creator not found", 404);
  }

  const brandAccount = await User.findById(brandUserId);
  if (brandAccount) {
    const activeContractsCount = await Contract.countDocuments({
      sentBy: brandUserId,
      status: { $nin: ["signed", "declined", "expired"] },
    });
    if (!isUnderContractLimit(brandAccount.plan, activeContractsCount)) {
      throw new PaywallError(
        "You've reached the free plan limit of 2 active contracts. Upgrade to Pro for unlimited contracts.",
      );
    }
  }

  const contract = await Contract.create({
    ...rest,
    creator: creatorId,
    sentBy: brandUserId,
    status: "awaiting_signature",
  });

  await syncSourceEvent({
    owner: creatorId,
    title: `Contract expires — ${rest.brand}`,
    type: "deadline",
    date: contract.expiryDate,
    relatedBrand: rest.brand,
    sourceType: "contract",
    sourceId: contract._id.toString(),
  });

  const brandUser = await User.findById(brandUserId).select("name");
  await notifyUser({
    owner: creatorId,
    type: "contract",
    title: "New contract to sign",
    description: `${brandUser?.name ?? "A brand"} sent you a contract: ${rest.title}`,
    relatedBrand: rest.brand,
    link: `/contracts/${contract._id}`,
  });

  return contract;
}

export async function signContract(
  id: string,
  userId: string,
  input: SignContractInput,
  meta: { ip: string; userAgent: string },
) {
  const contract = await getContractById(id, userId);
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isCreator = contract.creator.toString() === userId;
  const isBrand = contract.sentBy?.toString() === userId;

  if (!isCreator && !isBrand) {
    throw new AppError("You are not part of this contract", 403);
  }
  if (isCreator && contract.creatorSigned) {
    throw new AppError("You have already signed this contract", 400);
  }
  if (isBrand && contract.brandSigned) {
    throw new AppError("You have already signed this contract", 400);
  }

  // Odredi koju sliku potpisa koristimo — sačuvanu ili novonacrtanu
  let signatureImageUrl: string;

  if (input.useSavedSignature) {
    if (!user.savedSignatureUrl) {
      throw new AppError(
        "You don't have a saved signature. Please draw one.",
        400,
      );
    }
    signatureImageUrl = user.savedSignatureUrl;
  } else {
    if (!input.signatureImage) {
      throw new AppError("Signature is required", 400);
    }
    const uploaded = await saveSignatureImage(input.signatureImage, userId);
    signatureImageUrl = uploaded.url;

    // Ako korisnik želi, sačuvaj OVAJ potpis kao njegov podrazumevani za buduće ugovore
    if (input.saveSignatureForFuture) {
      user.savedSignatureUrl = signatureImageUrl;
      await user.save();
    }
  }

  const signatureRecord = {
    signedBy: userId as unknown as typeof contract.creator,
    fullName: input.fullName,
    signatureImageUrl,
    ip: meta.ip,
    userAgent: meta.userAgent,
    timestamp: new Date(),
    consentText:
      "By drawing my signature above and clicking Sign, I agree that this constitutes my legal electronic signature on this document, and that I am signing this document of my own free will.",
  };

  if (isCreator) {
    contract.creatorSigned = true;
    contract.creatorSignature = signatureRecord;
  } else {
    contract.brandSigned = true;
    contract.brandSignature = signatureRecord;
  }

  contract.documentHash = hashContractText(contract.bodyText);

  if (contract.creatorSigned && contract.brandSigned) {
    contract.status = "signed";
    await contract.save();
    contract.finalPdfUrl = await generateSignedContractPdf(contract);
  }

  await contract.save();

  const otherPartyId = isCreator
    ? contract.sentBy?.toString()
    : contract.creator.toString();
  if (otherPartyId) {
    const signer = await User.findById(userId).select("name");
    await notifyUser({
      owner: otherPartyId,
      type: "contract",
      title:
        contract.status === "signed"
          ? "Contract fully signed"
          : "Contract signed by other party",
      description: `${signer?.name ?? "The other party"} signed "${contract.title}"${
        contract.status === "signed" ? " — the contract is now complete" : ""
      }`,
      relatedBrand: contract.brand,
      link: `/contract/${contract._id}`,
    });
  }

  return contract;
}

export async function updateContract(
  id: string,
  userId: string,
  input: UpdateContractInput,
) {
  const contract = await Contract.findOneAndUpdate(
    { _id: id, creator: userId },
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }
  return contract;
}

export async function deleteContract(id: string, userId: string) {
  const contract = await Contract.findOneAndDelete({
    _id: id,
    creator: userId,
  });
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }
  return contract;
}

export async function getContractsSentByUser(brandUserId: string) {
  return Contract.find({ sentBy: brandUserId }).sort({ createdAt: -1 });
}

export async function declineContract(id: string, creatorId: string) {
  const contract = await Contract.findOne({ _id: id, creator: creatorId });
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }
  if (contract.status === "signed") {
    throw new AppError("Cannot decline a contract that is already signed", 400);
  }

  contract.status = "declined";
  await contract.save();
  await removeSourceEvent("contract", contract._id.toString());

  if (contract.sentBy) {
    const creator = await User.findById(creatorId).select("name");
    await notifyUser({
      owner: contract.sentBy.toString(),
      type: "contract",
      title: "Contract declined",
      description: `${creator?.name ?? "The creator"} declined "${contract.title}"`,
      relatedBrand: contract.brand,
      link: `/contracts/${contract._id}`,
    });
  }

  return contract;
}

export async function requestChanges(
  id: string,
  creatorId: string,
  input: RequestChangesInput,
) {
  const contract = await Contract.findOne({ _id: id, creator: creatorId });
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }
  if (contract.status === "signed") {
    throw new AppError(
      "Cannot request changes on a contract that is already signed",
      400,
    );
  }

  contract.status = "changes_requested";
  contract.revisionRequests.push({
    message: input.message,
    requestedBy: creatorId as unknown as typeof contract.creator,
    createdAt: new Date(),
  });
  await contract.save();

  if (contract.sentBy) {
    const creator = await User.findById(creatorId).select("name");
    await notifyUser({
      owner: contract.sentBy.toString(),
      type: "contract",
      title: "Changes requested",
      description: `${creator?.name ?? "The creator"} requested changes to "${contract.title}": ${input.message}`,
      relatedBrand: contract.brand,
      link: `/contract/${contract._id}`,
    });
  }

  return contract;
}

export async function reviseContract(
  id: string,
  brandUserId: string,
  input: ReviseContractInput,
) {
  const contract = await Contract.findOne({ _id: id, sentBy: brandUserId });
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }
  if (contract.status !== "changes_requested") {
    throw new AppError("This contract is not awaiting revision", 400);
  }

  if (input.bodyText !== undefined) contract.bodyText = input.bodyText;
  if (input.value !== undefined) contract.value = input.value;
  if (input.expiryDate !== undefined) {
    contract.expiryDate = input.expiryDate;
    await syncSourceEvent({
      owner: contract.creator.toString(),
      title: `Contract expires - ${contract.brand}`,
      type: "deadline",
      date: input.expiryDate,
      relatedBrand: contract.brand,
      sourceType: "contract",
      sourceId: contract._id.toString(),
    });
  }
  contract.status = "awaiting_signature";
  // Reset potpisa — nova verzija teksta zahteva svež pristanak obe strane
  contract.creatorSigned = false;
  contract.brandSigned = false;
  contract.creatorSignature = undefined;
  contract.brandSignature = undefined;
  await contract.save();

  const brandUser = await User.findById(brandUserId).select("name");
  await notifyUser({
    owner: contract.creator.toString(),
    type: "contract",
    title: "Contract revised",
    description: `${brandUser?.name ?? "The brand"} updated "${contract.title}" based on your feedback — please review and sign`,
    relatedBrand: contract.brand,
    link: `/contracts/${contract._id}`,
  });

  return contract;
}

export async function withdrawContract(id: string, brandUserId: string) {
  const contract = await Contract.findOne({ _id: id, sentBy: brandUserId });
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }
  if (contract.status === "signed") {
    throw new AppError(
      "Cannot withdraw a contract that is already signed",
      400,
    );
  }

  contract.status = "declined";
  await contract.save();
  await removeSourceEvent("contract", contract._id.toString());

  const brandUser = await User.findById(brandUserId).select("name");
  await notifyUser({
    owner: contract.creator.toString(),
    type: "contract",
    title: "Contract withdrawn",
    description: `${brandUser?.name ?? "The brand"} withdrew "${contract.title}"`,
    relatedBrand: contract.brand,
    link: `/contracts/${contract._id}`,
  });

  return contract;
}
