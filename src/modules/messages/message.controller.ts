import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as messageService from "@/modules/messages/message.service";
import type {
  CreateConversationInput,
  SendMessageInput,
} from "@/modules/messages/message.validation";

function getParam(req: Request, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

export const getConversations = asyncHandler(
  async (req: Request, res: Response) => {
    const conversations = await messageService.getConversationsForUser(
      req.user!.id,
    );
    res.status(200).json({ conversations });
  },
);

export const createConversation = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as CreateConversationInput;
    const conversation = await messageService.createConversation(
      req.user!.id,
      input,
    );
    res.status(201).json({ conversation });
  },
);

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const conversationId = getParam(req, "conversationId");
  const messages = await messageService.getMessages(
    conversationId,
    req.user!.id,
  );
  res.status(200).json({ messages });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const conversationId = getParam(req, "conversationId");
  const input = req.body as SendMessageInput;
  const message = await messageService.sendMessage(
    conversationId,
    req.user!.id,
    input,
  );
  res.status(201).json({ message });
});

export const deleteConversation = asyncHandler(
  async (req: Request, res: Response) => {
    const conversationId = getParam(req, "conversationId");

    await messageService.deleteConversationForUser(
      conversationId,
      req.user!.id,
    );
    res.status(204).send();
  },
);
