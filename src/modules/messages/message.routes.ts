import { Router } from "express";
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  deleteConversation,
} from "@/modules/messages/message.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import {
  createConversationSchema,
  sendMessageSchema,
  conversationParamsSchema,
} from "@/modules/messages/message.validation";

const router = Router();

router.use(requireAuth);

router.get("/conversations", getConversations);
router.post(
  "/conversations",
  validate(createConversationSchema),
  createConversation,
);
router.get(
  "/conversations/:conversationId/messages",
  validate(conversationParamsSchema),
  getMessages,
);
router.post(
  "/conversations/:conversationId/messages",
  validate(sendMessageSchema),
  sendMessage,
);
router.delete(
  "/conversations/:conversationId",
  validate(conversationParamsSchema),
  deleteConversation,
);

export default router;
