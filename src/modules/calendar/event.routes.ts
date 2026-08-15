import { Router } from "express";
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/modules/calendar/event.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import {
  createEventSchema,
  updateEventSchema,
  eventParamsSchema,
  eventRangeQuerySchema,
} from "@/modules/calendar/event.validation";

const router = Router();

router.use(requireAuth);

router.get("/", validate(eventRangeQuerySchema), getEvents);
router.get("/:id", validate(eventParamsSchema), getEvent);
router.post("/", validate(createEventSchema), createEvent);
router.patch("/:id", validate(updateEventSchema), updateEvent);
router.delete("/:id", validate(eventParamsSchema), deleteEvent);

export default router;
