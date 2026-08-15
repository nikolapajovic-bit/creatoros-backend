import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/utils/tokens";
import { AppError } from "@/utils/AppError";
import { asyncHandler } from "@/utils/asyncHandler";

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Not authenticated", 401);
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.id, role: payload.role };
      next();
    } catch {
      throw new AppError("Invalid or expired token", 401);
    }
  },
);
