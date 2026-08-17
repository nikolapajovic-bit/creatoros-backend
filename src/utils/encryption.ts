import crypto from "crypto";
import { env } from "@/config/env";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(env.ENCRYPTION_KEY, "hex");

/*
    Enkriptuje test pomocu AES-256-GCM. Rezultat je jedan string koji sadrzi
    IV (initialization vector), auth tag, i sam sifrovan sadrzaj - spojene
    dvotackama, da bi se lako cuvao kao jedno polje u bazi
*/
export function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/*
    Dekriptuje string koji je prethodno enkriptovan funkcijom encrypt().
    Baca gresku ako je sadrzaj izmenjen/ostecen (GCM auth tag ne prolazi proveru).
*/
export function decrypt(cipherText: string): string {
  const [ivHex, authTagHex, encryptedHex] = cipherText.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted payload format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/*
    Pomocne funkcije specificno za brojeve (npr. value polje) - enkriptuju/dekriptuju
    broj tako sto ga prvo pretvore u string
*/

export function encryptNumber(value: number): string {
  return encrypt(String(value));
}

export function decryptNumber(cipherText: string): number {
  return Number(decrypt(cipherText));
}
