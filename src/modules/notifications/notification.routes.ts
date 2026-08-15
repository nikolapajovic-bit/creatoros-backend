import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/modules/notifications/notification.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { notificationParamsSchema } from "@/modules/notifications/notification.validation";

const router = Router();

router.use(requireAuth);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.delete("/clear-all", clearAllNotifications);
router.patch("/:id/read", validate(notificationParamsSchema), markAsRead);
router.delete("/:id", validate(notificationParamsSchema), deleteNotification);

export default router;
