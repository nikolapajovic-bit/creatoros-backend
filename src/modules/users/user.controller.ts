import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { User } from "@/modules/users/user.model";
import { Deal } from "@/modules/deals/deal.model";
import { Contract } from "@/modules/contracts/contract.model";

export const findUserByEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const email = req.query.email as string | undefined;
    if (!email) {
      throw new AppError("Email query parameter is required", 400);
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("name email role");
    if (!user) {
      throw new AppError("No user found with that email", 404);
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  },
);

export const listCreators = asyncHandler(
  async (_req: Request, res: Response) => {
    const creators = await User.find({ role: "creator" }).select(
      "name email avatarUrl",
    );
    res.status(200).json({
      creators: creators.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        avatarUrl: c.avatarUrl,
      })),
    });
  },
);

export const getBusinessContacts = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const deals = await Deal.find({
      $or: [{ creator: userId }, { sentBy: userId }],
    }).select("creator sentBy");

    const contracts = await Contract.find({
      $or: [{ creator: userId }, { sentBy: userId }],
    }).select("creator sentBy");

    const contactIds = new Set<string>();
    for (const d of [...deals, ...contracts]) {
      const creatorId = d.creator?.toString();
      const sentById = d.sentBy?.toString();
      if (creatorId && creatorId !== userId) contactIds.add(creatorId);
      if (sentById && sentById !== userId) contactIds.add(sentById);
    }

    const contacts = await User.find({
      _id: { $in: Array.from(contactIds) },
    }).select("name email role avatarUrl");

    res.status(200).json({
      contacts: contacts.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        role: c.role,
        avatarUrl: c.avatarUrl,
      })),
    });
  },
);
