import { Router } from "express";
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getPayouts,
  createPayout,
  getMonthlyRevenue,
  suggestInvoiceNumber,
  getReceivedInvoices,
} from "@/modules/finance/finance.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  createPayoutSchema,
  financeParamsSchema,
} from "@/modules/finance/finance.validation";

const router = Router();

router.use(requireAuth);

router.get("/invoices", getInvoices);
router.get("/invoices/received", getReceivedInvoices);
router.get("/invoices/suggest-number", suggestInvoiceNumber);
router.post("/invoices", validate(createInvoiceSchema), createInvoice);
router.patch("/invoices/:id", validate(updateInvoiceSchema), updateInvoice);
router.delete("/invoices/:id", validate(financeParamsSchema), deleteInvoice);

router.get("/payouts", getPayouts);
router.post("/payouts", validate(createPayoutSchema), createPayout);

router.get("/revenue", getMonthlyRevenue);

export default router;
