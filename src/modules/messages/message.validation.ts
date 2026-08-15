import { z } from "zod";
import { CONVERSATION_TYPES } from "@/modules/messages/conversation.model";

export const createConversationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(200),
    type: z.enum(CONVERSATION_TYPES).default("brand"),
    participantIds: z.array(z.string()).default([]),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    text: z.string().min(1, "Message cannot be empty").max(5000),
  }),
  params: z.object({
    conversationId: z.string().min(1),
  }),
});

export const conversationParamsSchema = z.object({
  params: z.object({
    conversationId: z.string().min(1),
  }),
});

export type CreateConversationInput = z.infer<
  typeof createConversationSchema
>["body"];
export type SendMessageInput = z.infer<typeof sendMessageSchema>["body"];
