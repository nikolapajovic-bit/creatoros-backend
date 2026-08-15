import { Schema, model, type Document, type Types } from "mongoose";

export const PAYOUT_STATUSES = ["pending", "processing", "completed"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export interface IPayout extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  amount: number;
  currency: string;
  status: PayoutStatus;
  date: Date;
  method: string;
  createdAt: Date;
  updatedAt: Date;
}

const payoutSchema = new Schema<IPayout>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: PAYOUT_STATUSES,
      default: "pending",
    },
    date: {
      type: Date,
      required: true,
    },
    method: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export const Payout = model<IPayout>("Payout", payoutSchema);
