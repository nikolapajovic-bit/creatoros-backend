import { Event } from "@/modules/calendar/event.model";
import { AppError } from "@/utils/AppError";
import type {
  CreateEventInput,
  UpdateEventInput,
} from "@/modules/calendar/event.validation";

import type { EventSourceType } from "@/modules/calendar/event.model";

interface SyncEventInput {
  owner: string;
  title: string;
  type: "deadline";
  date: Date;
  relatedBrand?: string;
  sourceType: EventSourceType;
  sourceId: string;
}

export async function getEventsInRange(ownerId: string, from: Date, to: Date) {
  return Event.find({
    owner: ownerId,
    date: { $gte: from, $lte: to },
  }).sort({ date: 1 });
}

export async function getEventById(id: string, ownerId: string) {
  const event = await Event.findOne({ _id: id, owner: ownerId });
  if (!event) {
    throw new AppError("Event not found", 404);
  }
  return event;
}

export async function createEvent(ownerId: string, input: CreateEventInput) {
  return Event.create({ ...input, owner: ownerId });
}

export async function updateEvent(
  id: string,
  ownerId: string,
  input: UpdateEventInput,
) {
  const event = await Event.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!event) {
    throw new AppError("Event not found", 404);
  }
  return event;
}

export async function deleteEvent(id: string, ownerId: string) {
  const event = await Event.findOneAndDelete({ _id: id, owner: ownerId });
  if (!event) {
    throw new AppError("Event not found", 404);
  }
  return event;
}

export async function syncSourceEvent(input: SyncEventInput) {
  return Event.findOneAndUpdate(
    {
      owner: input.owner,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    },
    {
      $set: {
        title: input.title,
        type: input.type,
        date: input.date,
        relatedBrand: input.relatedBrand,
      },
    },
    {
      upsert: true,
      new: true,
    },
  );
}

export async function removeSourceEvent(
  sourceType: EventSourceType,
  sourceId: string,
) {
  await Event.deleteMany({ sourceType, sourceId });
}
