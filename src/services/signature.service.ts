import { cloudinary } from "@/config/cloudinary";
import { AppError } from "@/utils/AppError";

export async function saveSignatureImage(
  dataUrl: string,
  ownerId: string,
): Promise<{ url: string; publicId: string }> {
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) {
    throw new AppError("Invalid signature image format", 400);
  }

  const base64Data = match[1];
  const buffer = Buffer.from(base64Data, "base64");

  if (buffer.length < 200) {
    throw new AppError("Signature appears to be empty", 400);
  }

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: "creatoros/signatures",
    public_id: `signature-${ownerId}-${Date.now()}`,
    type: "authenticated",
  });

  return { url: result.secure_url, publicId: result.public_id };
}
