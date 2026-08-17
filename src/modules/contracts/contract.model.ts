import { Schema, model, type Document, type Types } from "mongoose";
import {
  encrypt,
  decrypt,
  encryptNumber,
  decryptNumber,
} from "@/utils/encryption";

export const CONTRACT_STATUSES = [
  "draft",
  "awaiting_signature",
  "changes_requested",
  "signed",
  "declined",
  "expired",
] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export interface ISignatureRecord {
  signedBy: Types.ObjectId;
  fullName: string; // ENKRIPTOVANO u bazi, dekriptuje se pri čitanju
  signaturePublicId: string; // Cloudinary public_id (authenticated tip, ne javan URL)
  ip: string; // ENKRIPTOVANO u bazi
  userAgent: string;
  timestamp: Date;
  consentText: string;
}

export interface IRevisionRequest {
  message: string;
  requestedBy: Types.ObjectId;
  createdAt: Date;
}

export interface IContract extends Document {
  _id: Types.ObjectId;
  creator: Types.ObjectId;
  sentBy?: Types.ObjectId;
  deal?: Types.ObjectId;
  title: string;
  brand: string;
  bodyText: string; // ENKRIPTOVANO u bazi, dekriptuje se pri čitanju
  status: ContractStatus;
  value: number; // ENKRIPTOVANO u bazi — dekriptovano na broj kad se čita, konvertuj sa Number() ako je potrebno
  currency: string;
  expiryDate: Date;
  creatorSigned: boolean;
  brandSigned: boolean;
  creatorSignature?: ISignatureRecord;
  brandSignature?: ISignatureRecord;
  documentHash?: string;
  finalPdfPublicId?: string; // Cloudinary public_id (authenticated), ne javan URL
  revisionRequests: IRevisionRequest[];
  createdAt: Date;
  updatedAt: Date;
}

const signatureRecordSchema = new Schema<ISignatureRecord>(
  {
    signedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fullName: {
      type: String,
      required: true,
      set: (v: string) => encrypt(v),
      get: (v: string) => (v ? decrypt(v) : v),
    },
    signaturePublicId: { type: String, required: true },
    ip: {
      type: String,
      required: true,
      set: (v: string) => encrypt(v),
      get: (v: string) => (v ? decrypt(v) : v),
    },
    userAgent: { type: String, required: true },
    timestamp: { type: Date, required: true },
    consentText: { type: String, required: true },
  },
  { _id: false, toJSON: { getters: true }, toObject: { getters: true } },
);

const contractSchema = new Schema<IContract>(
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
    deal: {
      type: Schema.Types.ObjectId,
      ref: "Deal",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    bodyText: {
      type: String,
      required: true,
      maxlength: 100000, // enkriptovan tekst je duži od originala, limit povećan da ostavi prostora
      set: (v: string) => encrypt(v),
      get: (v: string) => (v ? decrypt(v) : v),
    },
    status: {
      type: String,
      enum: CONTRACT_STATUSES,
      default: "draft",
    },
    value: {
      type: String,
      required: true,
      set: (v: number) => encryptNumber(v),
      get: (v: string) => (v ? String(decryptNumber(v)) : v),
    } as any,
    currency: {
      type: String,
      default: "USD",
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    creatorSigned: {
      type: Boolean,
      default: false,
    },
    brandSigned: {
      type: Boolean,
      default: false,
    },
    creatorSignature: signatureRecordSchema,
    brandSignature: signatureRecordSchema,
    documentHash: {
      type: String,
    },
    finalPdfPublicId: {
      type: String,
    },
    revisionRequests: [
      {
        message: { type: String, required: true, maxlength: 1000 },
        requestedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } },
);

export const Contract = model<IContract>("Contract", contractSchema);
