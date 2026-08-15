import { Schema, model, type Document, type Types } from "mongoose";

export const PLATFORMS = ["youtube", "instagram", "tiktok"] as const;
export type Platform = (typeof PLATFORMS)[number];

export interface ISocialAccount extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  platform: Platform;
  externalAccountId: string; // ID kanala/naloga na samoj platformi (npr. YouTube channel ID)
  displayName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt: Date;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const socialAccountSchema = new Schema<ISocialAccount>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: PLATFORMS,
      required: true,
    },
    externalAccountId: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
      select: false, // isti princip kao passwordHash — ne vraćaj u običnim upitima
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenExpiresAt: {
      type: Date,
      required: true,
    },
    lastSyncedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Jedan korisnik može imati samo jedan povezan nalog po platformi
socialAccountSchema.index({ owner: 1, platform: 1 }, { unique: true });

export const SocialAccount = model<ISocialAccount>(
  "SocialAccount",
  socialAccountSchema,
);
