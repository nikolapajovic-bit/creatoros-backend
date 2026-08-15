import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import * as mediaService from "@/modules/media/media.service";
import type { UploadMediaInput } from "@/modules/media/media.validation";

function getIdParam(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

export const getMedia = asyncHandler(async (req: Request, res: Response) => {
  const media = await mediaService.getMediaForUser(req.user!.id);
  res.status(200).json({ media });
});

export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const input = req.body as UploadMediaInput;
  const asset = await mediaService.createMediaAsset(
    req.user!.id,
    input,
    req.file,
  );
  res.status(201).json({ asset });
});

export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
  await mediaService.deleteMediaAsset(getIdParam(req), req.user!.id);
  res.status(204).send();
});
