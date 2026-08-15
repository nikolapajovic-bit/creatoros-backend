import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import * as eventService from "@/modules/calendar/event.service";
import type {
  CreateEventInput,
  UpdateEventInput,
} from "@/modules/calendar/event.validation";

function getIdParam(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as { from: Date; to: Date } | undefined;
  if (!query) {
    throw new AppError("Missing date range", 400);
  }

  const events = await eventService.getEventsInRange(
    req.user!.id,
    query.from,
    query.to,
  );
  res.status(200).json({ events });
});

export const getEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventService.getEventById(getIdParam(req), req.user!.id);
  res.status(200).json({ event });
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateEventInput;
  const event = await eventService.createEvent(req.user!.id, input);
  res.status(201).json({ event });
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateEventInput;
  const event = await eventService.updateEvent(
    getIdParam(req),
    req.user!.id,
    input,
  );
  res.status(200).json({ event });
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  await eventService.deleteEvent(getIdParam(req), req.user!.id);
  res.status(204).send();
});
