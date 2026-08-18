import { Conversation } from "@/modules/messages/conversation.model";
import { Message } from "@/modules/messages/message.model";
import { AppError } from "@/utils/AppError";
import { notifyUser } from "@/services/notification.service";
import { User } from "@/modules/users/user.model";
import { io } from "@/sockets";
import type {
  CreateConversationInput,
  SendMessageInput,
} from "@/modules/messages/message.validation";
import { isUnderConversationLimit } from "@/config/limits";
import { PaywallError } from "@/utils/PaywallError";

export async function getConversationsForUser(userId: string) {
  return Conversation.find({ participants: userId, hiddenFor: { $ne: userId } })
    .sort({
      lastMessageAt: -1,
    })
    .populate("participants", "name email");
}

export async function getConversationById(id: string, userId: string) {
  const conversation = await Conversation.findOne({
    _id: id,
    participants: userId,
  });
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }
  return conversation;
}

export async function createConversation(
  userId: string,
  input: CreateConversationInput,
) {
  const user = await User.findById(userId);
  if (user) {
    const conversationCount = await Conversation.countDocuments({
      participants: userId,
    });

    if (!isUnderConversationLimit(user.plan, conversationCount)) {
      throw new PaywallError(
        "You've reached the free plan limit of 5 conversations. Upgrade to Pro for unlimited messaging.",
      );
    }
  }

  const participants = Array.from(new Set([userId, ...input.participantIds]));

  // Za 1 na 1 razgovore, proveri da li vec postoji tacno isti par ucesnika
  if (input.type === "brand" && participants.length === 2) {
    const existing = await Conversation.findOne({
      type: "brand",
      participants: { $all: participants, $size: 2 },
    });
    if (existing) {
      // Ako je korisnik ranije "obrisao" ovaj razgovor kod sebe, klik na "start conversation"
      // je jasna namera da ga vrati nazad u svoju listu
      if (existing.hiddenFor.some((id) => id.toString() === userId)) {
        existing.hiddenFor = existing.hiddenFor.filter(
          (id) => id.toString() !== userId,
        );
        await existing.save();
      }
      return existing;
    }
  }

  const conversation = await Conversation.create({
    name: input.name,
    type: input.type,
    participants,
  });

  const creator = await User.findById(userId).select("name");
  const otherParticipants = participants.filter((id) => id !== userId);

  await Promise.all(
    otherParticipants.map((participantId) =>
      notifyUser({
        owner: participantId,
        type: "message",
        title: "New conversation started",
        description: `${creator?.name ?? "Someone"} started a conversation with you`,
        link: `/messages?conversation=${conversation._id}`,
      }),
    ),
  );

  // Obavesti sve učesnike uživo da im se pojavio nov razgovor u listi
  if (io) {
    for (const participantId of otherParticipants) {
      io.to(`user:${participantId}`).emit("conversation:new", {
        conversationId: conversation._id,
      });
    }
  }

  return conversation;
}

export async function getMessages(conversationId: string, userId: string) {
  // Prvo potvrdi da korisnik učestvuje u ovom razgovoru (bezbednost)
  await getConversationById(conversationId, userId);
  return Message.find({ conversation: conversationId })
    .sort({ createdAt: 1 })
    .populate("sender", "name");
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  input: SendMessageInput,
) {
  const conversation = await getConversationById(conversationId, senderId); // baca 404 ako korisnik nije učesnik

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text: input.text,
  });

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: {
        lastMessageAt: new Date(),
        lastMessageText:
          input.text.length > 80 ? `${input.text.slice(0, 80)}...` : input.text,
        lastMessageSenderId: senderId,
        hiddenFor: [],
      },
    },
  );

  const sender = await User.findById(senderId).select("name");
  const otherParticipants = conversation.participants
    .map((id) => id.toString())
    .filter((id) => id !== senderId);

  await Promise.all(
    otherParticipants.map((participantId) =>
      notifyUser({
        owner: participantId,
        type: "message",
        title: `New message from ${sender?.name ?? "someone"}`,
        description:
          input.text.length > 100
            ? `${input.text.slice(0, 100)}...`
            : input.text,
        link: `/messages?conversation=${conversationId}`,
      }),
    ),
  );

  return message;
}

export async function deleteConversationForUser(
  conversationId: string,
  userId: string,
) {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $addToSet: { hiddenFor: userId },
    },
  );
}
