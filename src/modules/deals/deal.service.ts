import { Deal } from "@/modules/deals/deal.model";
import { AppError } from "@/utils/AppError";
import { notifyUser } from "@/services/notification.service";
import { User } from "@/modules/users/user.model";
import { createInvoiceFromDeal } from "../finance/finance.service";
import type {
  CreateDealInput,
  SendDealInput,
  UpdateDealInput,
} from "@/modules/deals/deal.validation";
import {
  syncSourceEvent,
  removeSourceEvent,
} from "@/modules/calendar/event.service";
import { isUnderDealLimit } from "@/config/limits";
import { PaywallError } from "@/utils/PaywallError";

export async function getDealsForUser(userId: string) {
  return Deal.find({ creator: userId }).sort({ createdAt: -1 });
}

export async function getDealById(id: string, userId: string) {
  const deal = await Deal.findOne({
    _id: id,
    $or: [{ creator: userId }, { sentBy: userId }],
  });
  if (!deal) {
    throw new AppError("Deal not found", 404);
  }
  return deal;
}

// Kreator sam kreira svoj deal (postojeći tok) — odmah "accepted"
export async function createDeal(creatorId: string, input: CreateDealInput) {
  const creator = await User.findById(creatorId);
  if (creator) {
    const activeDealsCount = await Deal.countDocuments({
      creator: creatorId,
      stage: { $ne: "completed" },
    });

    if (!isUnderDealLimit(creator.plan, activeDealsCount)) {
      throw new PaywallError(
        "You've reached the free plan limit of 5 active deals. Upgrade to Pro for unlimited deals.",
      );
    }
  }

  return Deal.create({
    ...input,
    creator: creatorId,
    approvalStatus: "accepted",
  });
}

// Brend šalje deal kreatoru — status "pending" dok kreator ne odgovori
export async function sendDeal(brandUserId: string, input: SendDealInput) {
  const { creatorId, ...rest } = input;

  const creator = await User.findOne({ _id: creatorId, role: "creator" });
  if (!creator) {
    throw new AppError("Creator not found", 404);
  }

  const brandAccount = await User.findById(brandUserId);
  if (brandAccount) {
    const activeDealsCount = await Deal.countDocuments({
      sentBy: brandUserId,
      stage: { $ne: "completed" },
    });

    if (!isUnderDealLimit(brandAccount.plan, activeDealsCount)) {
      throw new PaywallError(
        "You've reached the free plan limit of 5 active deals. Upgrade to Pro for unlimited deals.",
      );
    }
  }

  const deal = await Deal.create({
    ...rest,
    creator: creatorId,
    sentBy: brandUserId,
    approvalStatus: "pending",
    stage: "inquiry",
  });

  const brandUser = await User.findById(brandUserId).select("name");
  await notifyUser({
    owner: creatorId,
    type: "deal",
    title: "New deal proposal",
    description: `${brandUser?.name ?? "A brand"} sent you a deal proposal: ${rest.title}`,
    relatedBrand: rest.brand,
    link: `/deals/${deal._id}`,
  });

  return deal;
}

// Dealovi koje je TREBUTNI korisnik (brend) poslao — za "Sent" pregled na brand strani
export async function getDealsSentByUser(brandUserId: string) {
  return Deal.find({ sentBy: brandUserId }).sort({ createdAt: -1 });
}

export async function respondToDeal(
  id: string,
  creatorId: string,
  response: "accepted" | "declined",
) {
  const deal = await Deal.findOne({ _id: id, creator: creatorId });
  if (!deal) {
    throw new AppError("Deal not found", 404);
  }
  if (deal.approvalStatus !== "pending") {
    throw new AppError("This deal has already been responded to", 400);
  }

  deal.approvalStatus = response;
  await deal.save();

  if (deal.sentBy) {
    const creator = await User.findById(creatorId).select("name");
    await notifyUser({
      owner: deal.sentBy.toString(),
      type: "deal",
      title: response === "accepted" ? "Deal accepted" : "Deal declined",
      description: `${creator?.name ?? "The creator"} ${response} your proposal: ${deal.title}`,
      relatedBrand: deal.brand,
      link: `/deals/${deal._id}`,
    });
  }

  return deal;
}

export async function updateDeal(
  id: string,
  userId: string,
  input: UpdateDealInput,
) {
  const deal = await Deal.findOneAndUpdate(
    { _id: id, creator: userId },
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!deal) {
    throw new AppError("Deal not found", 404);
  }

  // Kad deal uđe u "in-progress", dodaj njegov rok u kalendar; ako izađe iz njega
  // (npr. pređe direktno u completed), event se uklanja u markDealComplete ispod
  if (input.stage === "in-progress") {
    await syncSourceEvent({
      owner: deal.creator.toString(),
      title: `Deliverable due — ${deal.brand}`,
      type: "deadline",
      date: deal.deadline,
      relatedBrand: deal.brand,
      sourceType: "deal",
      sourceId: deal._id.toString(),
    });
  }

  return deal;
}

export async function deleteDeal(id: string, userId: string) {
  const deal = await Deal.findOneAndDelete({ _id: id, creator: userId });
  if (!deal) {
    throw new AppError("Deal not found", 404);
  }
  return deal;
}

export async function proposeOffer(
  dealId: string,
  userId: string,
  input: { value: number; message?: string },
) {
  const deal = await Deal.findOne({ _id: dealId });
  if (!deal) {
    throw new AppError("Deal not found", 404);
  }

  const isParticipant =
    deal.creator.toString() === userId || deal.sentBy?.toString() === userId;
  if (!isParticipant) {
    throw new AppError("You are not part of this deal", 403);
  }

  if (deal.approvalStatus !== "accepted") {
    throw new AppError("Can only negotiate on accepted deals", 400);
  }

  deal.offers.push({
    value: input.value,
    message: input.message,
    proposedBy: userId as unknown as typeof deal.creator,
    createdAt: new Date(),
  });
  deal.stage = "negotiating";
  await deal.save();

  const otherPartyId =
    deal.creator.toString() === userId
      ? deal.sentBy?.toString()
      : deal.creator.toString();

  if (otherPartyId) {
    const proposer = await User.findById(userId).select("name");
    await notifyUser({
      owner: otherPartyId,
      type: "deal",
      title: "New counter-offer",
      description: `${proposer?.name ?? "Someone"} proposed ${input.value} ${deal.currency} for "${deal.title}"`,
      relatedBrand: deal.brand,
      link: `/deals/${deal._id}`,
    });
  }

  return deal;
}

export async function acceptOffer(dealId: string, userId: string) {
  const deal = await Deal.findOne({ _id: dealId });
  if (!deal) {
    throw new AppError("Deal not found", 404);
  }

  const isParticipant =
    deal.creator.toString() === userId || deal.sentBy?.toString() === userId;
  if (!isParticipant) {
    throw new AppError("You are not part of this deal", 403);
  }

  const latestOffer = deal.offers[deal.offers.length - 1];
  if (!latestOffer) {
    throw new AppError("No offer to accept", 400);
  }

  if (latestOffer.proposedBy.toString() === userId) {
    throw new AppError("You cannot accept your own offer", 400);
  }

  deal.value = latestOffer.value;
  deal.stage = "contract-sent";
  await deal.save();

  const otherPartyId =
    deal.creator.toString() === userId
      ? deal.sentBy?.toString()
      : deal.creator.toString();

  if (otherPartyId) {
    const accepter = await User.findById(userId).select("name");
    await notifyUser({
      owner: otherPartyId,
      type: "deal",
      title: "Offer accepted",
      description: `${accepter?.name ?? "The other party"} accepted your offer of ${latestOffer.value} ${deal.currency} for "${deal.title}"`,
      relatedBrand: deal.brand,
      link: `/deals/${deal._id}`,
    });
  }

  return deal;
}

export async function markDealComplete(dealId: string, userId: string) {
  const deal = await Deal.findOne({
    _id: dealId,
    $or: [{ creator: userId }, { sentBy: userId }],
  });

  if (!deal) {
    throw new AppError("Deal not found", 404);
  }

  if (deal.stage === "completed") {
    throw new AppError("This deal is already completed", 400);
  }

  const isCreator = deal.creator.toString() === userId;
  const isBrand = deal.sentBy?.toString() === userId;

  if (isCreator) {
    deal.creatorMarkedComplete = true;
  } else if (isBrand) {
    deal.brandMarkedComplete = true;
  } else {
    throw new AppError("You are not part of this deal", 403);
  }

  // Deal-ovi koje je kreator sam napravio nemaju 'drugu stranu' -
  // kreatorova potvrda je dovoljna da odmah zavrsi deal
  const bothConfirmed = deal.sentBy
    ? deal.creatorMarkedComplete && deal.brandMarkedComplete
    : deal.creatorMarkedComplete;

  if (bothConfirmed) {
    deal.stage = "completed";
  }

  await deal.save();

  if (bothConfirmed) {
    await removeSourceEvent("deal", deal._id.toString());
  }

  if (bothConfirmed && deal.sentBy) {
    await createInvoiceFromDeal({
      _id: deal._id,
      creator: deal.creator,
      sentBy: deal.sentBy,
      brand: deal.brand,
      title: deal.title,
      value: deal.value,
      currency: deal.currency,
      platform: deal.platform,
    });

    if (deal.sentBy) {
      await notifyUser({
        owner: deal.sentBy.toString(),
        type: "payment",
        title: "New invoice received",
        description: `You received an invoice for "${deal.title}" - ${deal.value} ${deal.currency}`,
        relatedBrand: deal.brand,
        link: `/deals/${deal._id}`,
      });
    }

    await notifyUser({
      owner: deal.creator.toString(),
      type: "payment",
      title: "Invoice sent",
      description: `An invoice for "${deal.title}" was automatically sent to ${deal.brand}`,
      relatedBrand: deal.brand,
      link: `/deals/${deal._id}`,
    });
  } else {
    const otherPartyId = isCreator
      ? deal.sentBy?.toString()
      : deal.creator.toString();

    if (otherPartyId) {
      const confirmer = await User.findById(userId).select("name");
      await notifyUser({
        owner: otherPartyId,
        type: "deal",
        title: "Deal marked as complete",
        description: `${confirmer?.name ?? "The other party"} marked "${deal.title}" as complete - please confirm too`,
        relatedBrand: deal.brand,
      });
    }
  }

  return deal;
}
