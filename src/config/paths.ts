import path from "path";
import fs from "fs";

export const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
export const MEDIA_DIR = path.join(UPLOAD_DIR, "media");
export const SIGNATURES_DIR = path.join(UPLOAD_DIR, "signatures");
export const CONTRACTS_DIR = path.join(UPLOAD_DIR, "contracts");
export const AVATARS_DIR = path.join(UPLOAD_DIR, "avatars");

// Osiguraj da svi podfolderi postoje pri startu servera
for (const dir of [
  UPLOAD_DIR,
  MEDIA_DIR,
  SIGNATURES_DIR,
  CONTRACTS_DIR,
  AVATARS_DIR,
]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
