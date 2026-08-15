import { Notification } from "@/modules/notifications/notification.model";
import type { NotificationType } from "@/modules/notifications/notification.model";
import { io } from "@/sockets";

interface CreateNotificationInput {
  owner: string;
  type: NotificationType;
  title: string;
  description: string;
  relatedBrand?: string;
  link?: string;
}

/**
 * Centralna funkcija za kreiranje notifikacija — pozivaju je drugi servisi
 * (npr. contract.service.ts kad se ugovor potpiše, deal.service.ts kad deal promeni fazu).
 * Automatski emituje real-time event ka korisniku ako je trenutno povezan preko socket.io.
 */
export async function notifyUser(input: CreateNotificationInput) {
  const notification = await Notification.create({
    owner: input.owner,
    type: input.type,
    title: input.title,
    description: input.description,
    relatedBrand: input.relatedBrand,
    link: input.link,
  });

  // io može biti undefined ako se ova funkcija pozove pre inicijalizacije socket servera (npr. u testovima)
  if (io) {
    io.to(`user:${input.owner}`).emit("notification:new", notification);
  }

  return notification;
}
