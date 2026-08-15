import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { Notification } from "@/modules/notifications/notification.model";
import { AppError } from "@/utils/AppError";

function getIdParam(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const notifications = await Notification.find({ owner: req.user!.id }).sort(
      { createdAt: -1 },
    );
    res.status(200).json({ notifications });
  },
);

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: getIdParam(req), owner: req.user!.id },
    { $set: { read: true } },
    { new: true },
  );
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }
  res.status(200).json({ notification });
});

export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    await Notification.updateMany(
      { owner: req.user!.id, read: false },
      { $set: { read: true } },
    );
    res.status(200).json({ message: "All notifications marked as read" });
  },
);

export const deleteNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const notification = await Notification.findOneAndDelete({
      _id: getIdParam(req),
      owner: req.user!.id,
    });
    if (!notification) {
      throw new AppError("Notification not found", 404);
    }
    res.status(204).send();
  },
);

export const clearAllNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    await Notification.deleteMany({ owner: req.user!.id });

    res.status(200).json({ message: "All notifications cleared" });
  },
);
