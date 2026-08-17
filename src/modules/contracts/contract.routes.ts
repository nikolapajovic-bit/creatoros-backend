import { Router } from "express";
import {
  getContracts,
  getSentContracts,
  getContract,
  createContract,
  sendContract,
  signContract,
  declineContract,
  requestChanges,
  reviseContract,
  withdrawContract,
  updateContract,
  deleteContract,
  getSignedPdfUrl,
} from "@/modules/contracts/contract.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { validate } from "@/middleware/validate";
import { auditLog } from "@/middleware/auditLog.middleware";
import {
  createContractSchema,
  sendContractSchema,
  signContractSchema,
  updateContractSchema,
  contractParamsSchema,
  requestChangesSchema,
  reviseContractSchema,
} from "@/modules/contracts/contract.validation";

const router = Router();

router.use(requireAuth);
router.use(auditLog("Contract"));

router.get("/", getContracts);
router.get("/sent", requireRole("brand", "agency", "admin"), getSentContracts);
router.get("/:id", validate(contractParamsSchema), getContract);
router.get("/:id/pdf-url", validate(contractParamsSchema), getSignedPdfUrl);
router.post("/", validate(createContractSchema), createContract);
router.post(
  "/send",
  requireRole("brand", "agency", "admin"),
  validate(sendContractSchema),
  sendContract,
);
router.post("/:id/sign", validate(signContractSchema), signContract);
router.patch("/:id/decline", validate(contractParamsSchema), declineContract);
router.post(
  "/:id/request-changes",
  validate(requestChangesSchema),
  requestChanges,
);
router.patch(
  "/:id/revise",
  requireRole("brand", "agency", "admin"),
  validate(reviseContractSchema),
  reviseContract,
);
router.patch(
  "/:id/withdraw",
  requireRole("brand", "agency", "admin"),
  validate(contractParamsSchema),
  withdrawContract,
);
router.patch("/:id", validate(updateContractSchema), updateContract);
router.delete("/:id", validate(contractParamsSchema), deleteContract);

export default router;
