import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as youtubeService from "@/modules/analytics/youtube.service";
import { env } from "@/config/env";

export const connectYoutube = asyncHandler(
  async (req: Request, res: Response) => {
    const authUrl = youtubeService.getAuthUrl(req.user!.id);
    res.status(200).json({ url: authUrl });
  },
);

export const youtubeCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, state, error } = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    const frontendUrl = env.CLIENT_URL[0]; // koristi prvi dozvoljen origin za redirect nazad

    if (error || !code || !state) {
      res.redirect(`${frontendUrl}/analytics?youtube=error`);
      return;
    }

    try {
      await youtubeService.handleCallback(code, state);
      res.redirect(`${frontendUrl}/analytics?youtube=connected`);
    } catch (err) {
      console.error("YouTube OAuth callback error:", err);
      res.redirect(`${frontendUrl}/analytics?youtube=error`);
    }
  },
);

export const getYoutubeStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await youtubeService.getChannelStats(req.user!.id);
    res.status(200).json({ stats });
  },
);

export const getYoutubeVideos = asyncHandler(
  async (req: Request, res: Response) => {
    const videos = await youtubeService.getRecentVideos(req.user!.id);
    res.status(200).json({ videos });
  },
);

export const getConnectionStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const connected = await youtubeService.isConnected(req.user!.id);
    res.status(200).json({ connected });
  },
);
