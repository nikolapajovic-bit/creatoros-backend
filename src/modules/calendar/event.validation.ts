import { z } from "zod";
import { EVENT_TYPES } from "@/modules/calendar/event.model";

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(300),
    type: z.enum(EVENT_TYPES).default("post"),
    date: z.coerce.date(),
    time: z.string().optional(),
    relatedBrand: z.string().optional(),
  }),
});

export const updateEventSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(300).optional(),
    type: z.enum(EVENT_TYPES).optional(),
    date: z.coerce.date().optional(),
    time: z.string().optional(),
    relatedBrand: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const eventParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const eventRangeQuerySchema = z.object({
  query: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
});

export type CreateEventInput = z.infer<typeof createEventSchema>["body"];
export type UpdateEventInput = z.infer<typeof updateEventSchema>["body"];
