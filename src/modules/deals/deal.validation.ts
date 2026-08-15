import { z } from "zod";
import { DEAL_STAGES, PLATFORMS } from "@/modules/deals/deal.model";

export const createDealSchema = z.object({
  body: z.object({
    brand: z.string().min(1, "Brand is required").max(200),
    title: z.string().min(1, "Title is required").max(300),
    stage: z.enum(DEAL_STAGES).default("inquiry"),
    value: z.number().min(0, "Value must be positive"),
    currency: z.string().default("USD"),
    deadline: z.coerce.date(),
    platform: z.enum(PLATFORMS).default("other"),
  }),
});

// Kad brend šalje deal — mora eksplicitno navesti kom kreatoru
export const sendDealSchema = z.object({
  body: z.object({
    creatorId: z.string().min(1, "Creator is required"),
    brand: z.string().min(1, "Brand is required").max(200),
    title: z.string().min(1, "Title is required").max(300),
    value: z.number().min(0, "Value must be positive"),
    currency: z.string().default("USD"),
    deadline: z.coerce.date(),
    platform: z.enum(PLATFORMS).default("other"),
  }),
});

export const updateDealSchema = z.object({
  body: z.object({
    brand: z.string().min(1).max(200).optional(),
    title: z.string().min(1).max(300).optional(),
    stage: z.enum(DEAL_STAGES).optional(),
    value: z.number().min(0).optional(),
    currency: z.string().optional(),
    deadline: z.coerce.date().optional(),
    platform: z.enum(PLATFORMS).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const dealParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const proposeOfferSchema = z.object({
  body: z.object({
    value: z.number().min(0, "Value must be positive"),
    message: z.string().max(500).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export type ProposeOfferInput = z.infer<typeof proposeOfferSchema>["body"];
export type CreateDealInput = z.infer<typeof createDealSchema>["body"];
export type SendDealInput = z.infer<typeof sendDealSchema>["body"];
export type UpdateDealInput = z.infer<typeof updateDealSchema>["body"];
