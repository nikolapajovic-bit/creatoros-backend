import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "@/config/cloudinary";
import { AppError } from "@/utils/AppError";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const storage = new CloudinaryStorage({
  cloudinary,
  params: (_req, file) => ({
    folder: "creatoros/media",
    resource_type: file.mimetype.startsWith("video/") ? "video" : "image",
  }),
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new AppError(`File type ${file.mimetype} is not allowed`, 400));
    return;
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export function getMediaTypeFromMime(mimeType: string): "image" | "video" {
  return mimeType.startsWith("video/") ? "video" : "image";
}

export async function deleteFile(
  publicId: string,
  resourceType: "image" | "video",
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
