import { Router } from "express";
import {
  checkUsername,
  completeOnboarding,
  mockUpgradeToPro,
} from "@/modules/users/onboarding.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import {
  checkUsernameSchema,
  completeOnboardingSchema,
} from "@/modules/users/onboarding.validation";

const router = Router();

router.use(requireAuth);

router.get("/username-available", validate(checkUsernameSchema), checkUsername);
router.post(
  "/complete",
  validate(completeOnboardingSchema),
  completeOnboarding,
);
router.post("/upgrade-mock", mockUpgradeToPro);

export default router;
