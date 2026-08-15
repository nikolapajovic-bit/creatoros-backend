import { Schema, model, type Document, type Types } from "mongoose";

export const EVENT_TYPES = ["post", "deadline", "meeting", "campaign"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type EventSourceType = "deal" | "contract";

export interface IEvent extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  type: EventType;
  date: Date;
  time?: string; // "14:00" format, opciono
  relatedBrand?: string;
  sourceType?: EventSourceType; // ako je event automatski generisan iz deal-a/ugovora
  sourceId?: Types.ObjectId;
  remindersSent: number[]; // koje podsetnike (5, 3, 1 dan) smo vec poslali za ovaj event
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    type: {
      type: String,
      enum: EVENT_TYPES,
      default: "post",
    },
    date: {
      type: Date,
      required: true,
      index: true, // često filtriramo po opsegu datuma (mesečni prikaz)
    },
    time: {
      type: String,
    },
    relatedBrand: {
      type: String,
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ["deal", "contract"],
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    remindersSent: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true },
);

export const Event = model<IEvent>("Event", eventSchema);
