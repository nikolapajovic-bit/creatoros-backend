import { Router } from "express";
import {
  findUserByEmail,
  getBusinessContacts,
  listCreators,
} from "@/modules/users/user.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";

const router = Router();

router.use(requireAuth);

router.get("/lookup", findUserByEmail);
router.get("/creators", requireRole("brand", "agency", "admin"), listCreators);
router.get("/contacts", getBusinessContacts);

export default router;
