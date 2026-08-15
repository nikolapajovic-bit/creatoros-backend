import { Schema, model, type Document, type Types } from "mongoose";

export const NOTIFICATION_TYPES = [
  "deadline",
  "message",
  "deal",
  "contract",
  "payment",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  type: NotificationType;
  title: string;
  description: string;
  read: boolean;
  relatedBrand?: string;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    read: {
      type: Boolean,
      default: false,
      index: true, // često filtriramo "samo nepročitane" i brojimo ih
    },
    relatedBrand: {
      type: String,
      trim: true,
    },
    link: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Notification = model<INotification>(
  "Notification",
  notificationSchema,
);
