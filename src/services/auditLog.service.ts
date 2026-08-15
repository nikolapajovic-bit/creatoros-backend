import { AuditLog, type AuditAction } from "@/models/auditLog.model";

interface LogAuditInput {
  actor: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
}

export async function logAudit(input: LogAuditInput) {
  try {
    await AuditLog.create(input);
  } catch (error) {
    // Audit log nikad ne sme da obori glavnu operaciju — samo logujemo grešku i nastavljamo
    console.error("Failed to write audit log:", error);
  }
}
