import { Schema, model, type Document, type Types } from "mongoose";

export const DEAL_STAGES = [
  "inquiry",
  "negotiating",
  "contract-sent",
  "in-progress",
  "completed",
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const PLATFORMS = ["instagram", "tiktok", "youtube", "other"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const APPROVAL_STATUSES = ["pending", "accepted", "declined"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export interface IOffer {
  value: number;
  message?: string;
  proposedBy: Types.ObjectId;
  createdAt: Date;
}

export interface IDeal extends Document {
  _id: Types.ObjectId;
  creator: Types.ObjectId; // korisnik (kreator) kome je deal namenjen
  sentBy?: Types.ObjectId; // brend korisnik koji je poslao deal (nedostaje ako je kreator sam kreirao)
  brand: string; // naziv brenda (tekstualno, i dalje korisno za prikaz)
  title: string;
  stage: DealStage;
  approvalStatus: ApprovalStatus;
  value: number;
  currency: string;
  deadline: Date;
  platform: Platform;
  offers: IOffer[];
  creatorMarkedComplete: boolean;
  brandMarkedComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const dealSchema = new Schema<IDeal>(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    stage: {
      type: String,
      enum: DEAL_STAGES,
      default: "inquiry",
    },
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: "accepted", // ako kreator sam kreira deal, automatski je "accepted" (nema koga da pita)
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    deadline: {
      type: Date,
      required: true,
    },
    platform: {
      type: String,
      enum: PLATFORMS,
      default: "other",
    },
    creatorMarkedComplete: {
      type: Boolean,
      default: false,
    },
    brandMarkedComplete: {
      type: Boolean,
      default: false,
    },
    offers: [
      {
        value: { type: Number, required: true, min: 0 },
        message: { type: String, trim: true, maxlength: 500 },
        proposedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const Deal = model<IDeal>("Deal", dealSchema);
