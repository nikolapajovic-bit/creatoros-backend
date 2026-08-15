import { Router } from "express";
import {
  getMedia,
  uploadMedia,
  deleteMedia,
} from "@/modules/media/media.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import {
  uploadMediaSchema,
  mediaParamsSchema,
} from "@/modules/media/media.validation";
import { upload } from "@/services/file.service";

const router = Router();

router.use(requireAuth);

router.get("/", getMedia);
router.post(
  "/",
  upload.single("file"),
  validate(uploadMediaSchema),
  uploadMedia,
);
router.delete("/:id", validate(mediaParamsSchema), deleteMedia);

export default router;
