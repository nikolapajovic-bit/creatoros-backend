import { Schema, model, type Document, type Types } from "mongoose";

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
  fullName: string; // ime za pravnu evidenciju (i dalje se unosi, uz nacrtan potpis)
  signatureImageUrl: string; // putanja do PNG fajla sa nacrtanim potpisom
  ip: string;
  userAgent: string;
  timestamp: Date;
  consentText: string; // tačan tekst saglasnosti koji je korisnik prihvatio
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
  bodyText: string; // puni tekst ugovora
  status: ContractStatus;
  value: number;
  currency: string;
  expiryDate: Date;
  creatorSigned: boolean;
  brandSigned: boolean;
  creatorSignature?: ISignatureRecord;
  brandSignature?: ISignatureRecord;
  documentHash?: string; // SHA-256 hash bodyText-a u trenutku poslednjeg potpisa — dokazuje da sadržaj nije menjan
  finalPdfUrl?: string; // putanja do generisanog "Certificate of Completion" PDF-a, popunjava se kad OBE strane potpišu
  revisionRequests: IRevisionRequest[];
  createdAt: Date;
  updatedAt: Date;
}

const signatureRecordSchema = new Schema<ISignatureRecord>(
  {
    signedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    signatureImageUrl: { type: String, required: true },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    timestamp: { type: Date, required: true },
    consentText: { type: String, required: true },
  },
  { _id: false },
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
    },
    status: {
      type: String,
      enum: CONTRACT_STATUSES,
      default: "draft",
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
    finalPdfUrl: {
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
  { timestamps: true },
);

export const Contract = model<IContract>("Contract", contractSchema);
