import { cloudinary } from "@/config/cloudinary";

export function getSignedFileUrl(
  publicId: string,
  resourceType: "image" | "raw",
  expiresInSeconds = 300,
): string {
  const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const format = resourceType === "raw" ? "pdf" : "png";

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: "authenticated",
    expires_at: timestamp,
  });
}
