import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "@/config/cloudinary";
import { AppError } from "@/utils/AppError";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "creatoros/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
    ],
  } as Record<string, unknown>,
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

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});
