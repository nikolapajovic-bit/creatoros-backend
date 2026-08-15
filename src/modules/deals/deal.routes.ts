import { Router } from "express";
import {
  getDeals,
  getSentDeals,
  getDeal,
  createDeal,
  sendDeal,
  respondToDeal,
  proposeOffer,
  acceptOffer,
  markComplete,
  updateDeal,
  deleteDeal,
} from "@/modules/deals/deal.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { validate } from "@/middleware/validate";
import { auditLog } from "@/middleware/auditLog.middleware";
import {
  createDealSchema,
  sendDealSchema,
  updateDealSchema,
  dealParamsSchema,
  proposeOfferSchema,
} from "@/modules/deals/deal.validation";

const router = Router();

router.use(requireAuth);
router.use(auditLog("Deal"));

router.get("/", getDeals);
router.get("/sent", requireRole("brand", "agency", "admin"), getSentDeals);
router.get("/:id", validate(dealParamsSchema), getDeal);
router.post("/", validate(createDealSchema), createDeal);
router.post(
  "/send",
  requireRole("brand", "agency", "admin"),
  validate(sendDealSchema),
  sendDeal,
);
router.patch("/:id/respond", validate(dealParamsSchema), respondToDeal);
router.post("/:id/offer", validate(proposeOfferSchema), proposeOffer);
router.patch("/:id/offer/accept", validate(dealParamsSchema), acceptOffer);
router.patch("/:id/complete", validate(dealParamsSchema), markComplete);
router.patch("/:id", validate(updateDealSchema), updateDeal);
router.delete("/:id", validate(dealParamsSchema), deleteDeal);

export default router;
