import crypto from "crypto";

export function hashContractText(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}
