import { Schema, model, type Document, type Types } from "mongoose";

export const MEDIA_TYPES = ["image", "video"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export interface IMediaAsset extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  type: MediaType;
  tags: string[];
  relatedBrand?: string;
  durationSeconds?: number;
  fileUrl: string;
  publicId: string; // Cloudinary identifikator, potreban za brisanje
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}

const mediaAssetSchema = new Schema<IMediaAsset>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    type: {
      type: String,
      enum: MEDIA_TYPES,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true, // filtriranje po tagovima
    },
    relatedBrand: {
      type: String,
      trim: true,
    },
    durationSeconds: {
      type: Number,
      min: 0,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

export const MediaAsset = model<IMediaAsset>("MediaAsset", mediaAssetSchema);
