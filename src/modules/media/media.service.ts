import { MediaAsset } from "@/modules/media/media.model";
import { AppError } from "@/utils/AppError";
import { getMediaTypeFromMime, deleteFile } from "@/services/file.service";
import type { UploadMediaInput } from "@/modules/media/media.validation";

export async function getMediaForUser(ownerId: string) {
  return MediaAsset.find({ owner: ownerId }).sort({ createdAt: -1 });
}

export async function createMediaAsset(
  ownerId: string,
  input: UploadMediaInput,
  file: Express.Multer.File & { filename: string; path: string },
) {
  return MediaAsset.create({
    owner: ownerId,
    title: input.title,
    tags: input.tags,
    relatedBrand: input.relatedBrand,
    durationSeconds: input.durationSeconds,
    type: getMediaTypeFromMime(file.mimetype),
    fileUrl: file.path, // pun Cloudinary URL
    publicId: file.filename, // Cloudinary public_id (multer-storage-cloudinary ga stavlja ovde)
    fileName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
  });
}

export async function deleteMediaAsset(id: string, ownerId: string) {
  const asset = await MediaAsset.findOne({ _id: id, owner: ownerId });
  if (!asset) {
    throw new AppError("Media asset not found", 404);
  }

  await deleteFile(asset.publicId, asset.type);

  await asset.deleteOne();
  return asset;
}
