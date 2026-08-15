import { Schema, model, type Document, type Types } from "mongoose";

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  billedTo?: Types.ObjectId;
  deal?: Types.ObjectId;
  contract?: Types.ObjectId;
  number: string;
  brand: string;
  description: string;
  platform?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedDate: Date;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    billedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    deal: {
      type: Schema.Types.ObjectId,
      ref: "Deal",
    },
    contract: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
    },
    number: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    platform: {
      type: String,
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
      enum: INVOICE_STATUSES,
      default: "draft",
    },
    issuedDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Broj fakture mora biti jedinstven po korisniku (ne globalno - dva korisnika mogu imati "INV-001")
invoiceSchema.index({ owner: 1, number: 1 }, { unique: true });

export const Invoice = model<IInvoice>("Invoice", invoiceSchema);
