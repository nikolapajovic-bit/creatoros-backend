import { z } from "zod";
import { INVOICE_STATUSES } from "@/modules/finance/invoice.model";
import { PAYOUT_STATUSES } from "@/modules/finance/payout.model";

export const createInvoiceSchema = z.object({
  body: z.object({
    number: z.string().min(1, "Invoice number is required"),
    brand: z.string().min(1, "Brand is required").max(200),
    amount: z.number().min(0, "Amount must be positive"),
    currency: z.string().default("USD"),
    issuedDate: z.coerce.date(),
    dueDate: z.coerce.date(),
    dealId: z.string().optional(),
    contractId: z.string().optional(),
  }),
});

export const updateInvoiceSchema = z.object({
  body: z.object({
    status: z.enum(INVOICE_STATUSES).optional(),
    amount: z.number().min(0).optional(),
    dueDate: z.coerce.date().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const createPayoutSchema = z.object({
  body: z.object({
    amount: z.number().min(0, "Amount must be positive"),
    currency: z.string().default("USD"),
    date: z.coerce.date(),
    method: z.string().min(1, "Method is required"),
    status: z.enum(PAYOUT_STATUSES).default("pending"),
  }),
});

export const financeParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>["body"];
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>["body"];
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>["body"];
