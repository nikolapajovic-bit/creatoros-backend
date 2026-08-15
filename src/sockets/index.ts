import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { verifyAccessToken } from "@/utils/tokens";
import { env } from "@/config/env";
import { registerMessageHandlers } from "@/sockets/messages.socket";

export let io: SocketIOServer;

export function initSockets(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // Auth middleware za socket konekcije — verifikuje JWT poslat pri konekciji
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Not authenticated"));
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.id;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    console.log(`🔌 Socket connected: user ${userId}`);

    // Svaki korisnik se pridružuje svojoj ličnoj "sobi" — koristimo za notifikacije
    socket.join(`user:${userId}`);

    registerMessageHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: user ${userId}`);
    });
  });

  return io;
}
