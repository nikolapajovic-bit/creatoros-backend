import { Schema, model, type Document, type Types } from "mongoose";

// Isti set uloga kao na frontendu (types/index.ts) — mora ostati usklađen
export const ROLES = [
  "creator",
  "brand",
  "agency",
  "moderator",
  "admin",
] as const;
export type Role = (typeof ROLES)[number];

export const PLANS = ["free", "pro"] as const;
export type Plan = (typeof PLANS)[number];

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  username?: string;
  passwordHash: string;
  role: Role;
  plan: Plan;
  avatarUrl?: string;
  savedSignatureUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  onboardingAnswers?: {
    platform?: string;
    goal?: string;
    painPoint?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
      default: "creator",
    },
    plan: {
      type: String,
      enum: PLANS,
      default: "free",
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingAnswers: {
      platform: { type: String },
      goal: { type: String },
      painPoint: { type: String },
    },
    avatarUrl: {
      type: String,
    },
    savedSignatureUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser>("User", userSchema);
