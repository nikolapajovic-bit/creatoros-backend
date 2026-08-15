import { z } from "zod";
import { CONTRACT_STATUSES } from "@/modules/contracts/contract.model";

export const createContractSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(300),
    brand: z.string().min(1, "Brand is required").max(200),
    bodyText: z.string().min(1, "Contract text is required"),
    value: z.number().min(0, "Value must be positive"),
    currency: z.string().default("USD"),
    expiryDate: z.coerce.date(),
    dealId: z.string().optional(),
  }),
});

export const sendContractSchema = z.object({
  body: z.object({
    creatorId: z.string().min(1, "Creator is required"),
    title: z.string().min(1, "Title is required").max(300),
    brand: z.string().min(1, "Brand is required").max(200),
    bodyText: z.string().min(1, "Contract text is required"),
    value: z.number().min(0, "Value must be positive"),
    currency: z.string().default("USD"),
    expiryDate: z.coerce.date(),
  }),
});

export const signContractSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, "Please type your full legal name"),
    agreedToConsent: z.literal(true, {
      message: "You must agree to sign electronically",
    }),

    signatureImage: z.string().optional(),
    useSavedSignature: z.boolean().default(false),
    saveSignatureForFuture: z.boolean().default(false),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const updateContractSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(300).optional(),
    status: z.enum(CONTRACT_STATUSES).optional(),
    value: z.number().min(0).optional(),
    expiryDate: z.coerce.date().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const contractParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const requestChangesSchema = z.object({
  body: z.object({
    message: z
      .string()
      .min(1, "Please describe what needs to change")
      .max(1000),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const reviseContractSchema = z.object({
  body: z
    .object({
      bodyText: z.string().min(1).optional(),
      value: z.number().min(0).optional(),
      expiryDate: z.coerce.date().optional(),
    })
    .refine(
      (data) => data.bodyText || data.value !== undefined || data.expiryDate,
      {
        message: "At least one field must be positive",
      },
    ),
  params: z.object({
    id: z.string().min(1),
  }),
});

export type RequestChangesInput = z.infer<typeof requestChangesSchema>["body"];
export type ReviseContractInput = z.infer<typeof reviseContractSchema>["body"];
export type CreateContractInput = z.infer<typeof createContractSchema>["body"];
export type SendContractInput = z.infer<typeof sendContractSchema>["body"];
export type SignContractInput = z.infer<typeof signContractSchema>["body"];
export type UpdateContractInput = z.infer<typeof updateContractSchema>["body"];
