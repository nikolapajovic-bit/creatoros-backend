import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  changePassword,
  updateAvatar,
  removeAvatar,
} from "@/modules/auth/auth.controller";
import { validate } from "@/middleware/validate";
import { registerSchema, loginSchema } from "@/modules/auth/auth.validation";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "@/modules/users/user.validation";
import { authRateLimiter } from "@/middleware/rateLimiter";
import { requireAuth } from "@/middleware/auth.middleware";
import { uploadAvatar } from "@/services/avatar.service";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  uploadAvatar.single("avatar"),
  validate(registerSchema),
  register,
);
router.post("/login", authRateLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.patch(
  "/profile",
  requireAuth,
  validate(updateProfileSchema),
  updateProfile,
);
router.post(
  "/avatar",
  requireAuth,
  uploadAvatar.single("avatar"),
  updateAvatar,
);
router.delete("/avatar", requireAuth, removeAvatar);
router.patch(
  "/password",
  requireAuth,
  authRateLimiter,
  validate(changePasswordSchema),
  changePassword,
);

export default router;
