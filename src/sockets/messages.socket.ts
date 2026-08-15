import type { Server as SocketIOServer, Socket } from "socket.io";
import {
  sendMessage,
  getConversationById,
} from "@/modules/messages/message.service";

interface SendMessagePayload {
  conversationId: string;
  text: string;
}

interface TypingPayload {
  conversationId: string;
}

export function registerMessageHandlers(io: SocketIOServer, socket: Socket) {
  const userId = socket.data.userId as string;

  // Klijent eksplicitno "ulazi" u sobu razgovora kad otvori taj chat na ekranu
  socket.on("conversation:join", async (conversationId: string) => {
    try {
      await getConversationById(conversationId, userId); // baca ako korisnik nije učesnik
      socket.join(`conversation:${conversationId}`);
    } catch {
      socket.emit("error", { message: "Cannot join conversation" });
    }
  });

  socket.on("conversation:leave", (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on("message:send", async (payload: SendMessagePayload) => {
    try {
      const message = await sendMessage(payload.conversationId, userId, {
        text: payload.text,
      });

      // Emituje svim klijentima u toj sobi (uključujući pošiljaoca — frontend prikazuje odmah)
      io.to(`conversation:${payload.conversationId}`).emit(
        "message:new",
        message,
      );
    } catch {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("typing:start", (payload: TypingPayload) => {
    socket.to(`conversation:${payload.conversationId}`).emit("typing:update", {
      userId,
      isTyping: true,
    });
  });

  socket.on("typing:stop", (payload: TypingPayload) => {
    socket.to(`conversation:${payload.conversationId}`).emit("typing:update", {
      userId,
      isTyping: false,
    });
  });
}
