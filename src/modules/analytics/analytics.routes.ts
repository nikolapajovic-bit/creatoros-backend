import { Router } from "express";
import {
  connectYoutube,
  youtubeCallback,
  getYoutubeStats,
  getYoutubeVideos,
  getConnectionStatus,
} from "@/modules/analytics/analytics.controller";
import { requireAuth } from "@/middleware/auth.middleware";

const router = Router();

router.get("/youtube/connect", requireAuth, connectYoutube);
router.get("/youtube/callback", youtubeCallback); // BEZ requireAuth — Google poziva ovo direktno
router.get("/youtube/status", requireAuth, getConnectionStatus);
router.get("/youtube/stats", requireAuth, getYoutubeStats);
router.get("/youtube/videos", requireAuth, getYoutubeVideos);

export default router;
