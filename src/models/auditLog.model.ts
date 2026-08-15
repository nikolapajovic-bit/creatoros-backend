import { Schema, model, type Document, type Types } from "mongoose";

export const AUDIT_ACTIONS = ["create", "update", "delete"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actor: Types.ObjectId; // ko je izvršio akciju
  action: AuditAction;
  resource: string; // naziv resursa, npr. "Deal", "Contract"
  resourceId: string;
  before?: unknown; // stanje pre izmene (za update/delete)
  after?: unknown; // stanje posle izmene (za create/update)
  ip?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  actor: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: AUDIT_ACTIONS,
    required: true,
  },
  resource: {
    type: String,
    required: true,
    index: true,
  },
  resourceId: {
    type: String,
    required: true,
  },
  before: {
    type: Schema.Types.Mixed,
  },
  after: {
    type: Schema.Types.Mixed,
  },
  ip: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
