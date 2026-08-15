import { Router } from "express";
import { generate } from "@/modules/ai/ai.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { generateSchema } from "@/modules/ai/ai.validation";
import { aiRateLimiter } from "@/middleware/rateLimiter";

const router = Router();

router.use(requireAuth);

router.post("/generate", aiRateLimiter, validate(generateSchema), generate);

export default router;
