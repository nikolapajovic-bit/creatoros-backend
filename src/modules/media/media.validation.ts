import { z } from "zod";

export const uploadMediaSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(300),
    tags: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(",").map((t) => t.trim()) : [])),
    relatedBrand: z.string().optional(),
    durationSeconds: z.coerce.number().min(0).optional(),
  }),
});

export const mediaParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export type UploadMediaInput = {
  title: string;
  tags: string[];
  relatedBrand?: string;
  durationSeconds?: number;
};
