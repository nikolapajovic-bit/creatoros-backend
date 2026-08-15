import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as financeService from "@/modules/finance/finance.service";
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CreatePayoutInput,
} from "@/modules/finance/finance.validation";

function getIdParam(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

// --- Invoices ---

export const getInvoices = asyncHandler(async (req: Request, res: Response) => {
  const invoices = await financeService.getInvoicesForUser(req.user!.id);
  res.status(200).json({ invoices });
});

export const createInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as CreateInvoiceInput;
    const invoice = await financeService.createInvoice(req.user!.id, input);
    res.status(201).json({ invoice });
  },
);

export const updateInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as UpdateInvoiceInput;
    const invoice = await financeService.updateInvoice(
      getIdParam(req),
      req.user!.id,
      input,
    );
    res.status(200).json({ invoice });
  },
);

export const deleteInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    await financeService.deleteInvoice(getIdParam(req), req.user!.id);
    res.status(204).send();
  },
);

// --- Payouts ---

export const getPayouts = asyncHandler(async (req: Request, res: Response) => {
  const payouts = await financeService.getPayoutsForUser(req.user!.id);
  res.status(200).json({ payouts });
});

export const createPayout = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as CreatePayoutInput;
    const payout = await financeService.createPayout(req.user!.id, input);
    res.status(201).json({ payout });
  },
);

// --- Overview ---

export const getMonthlyRevenue = asyncHandler(
  async (req: Request, res: Response) => {
    const revenue = await financeService.getMonthlyRevenue(req.user!.id);
    res.status(200).json({ revenue });
  },
);

export const suggestInvoiceNumber = asyncHandler(
  async (req: Request, res: Response) => {
    const number = await financeService.generateInvoiceNumber(req.user!.id);

    res.status(200).json({ number });
  },
);

export const getReceivedInvoices = asyncHandler(
  async (req: Request, res: Response) => {
    const invoices = await financeService.getReceivedInvoices(req.user!.id);

    res.status(200).json({ invoices });
  },
);
