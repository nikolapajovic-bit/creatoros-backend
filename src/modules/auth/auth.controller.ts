import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { env } from "@/config/env";
import * as authService from "@/modules/auth/auth.service";
import type { RegisterInput, LoginInput } from "@/modules/auth/auth.validation";

const REFRESH_COOKIE_NAME = "refreshToken";

function setRefreshCookie(res: Response, token: string) {
  const isProd = env.NODE_ENV === "production";
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dana
  });
}

function sanitizeUser(user: {
  _id: unknown;
  name: string;
  email: string;
  username?: string;
  role: string;
  plan?: string;
  avatarUrl?: string;
  savedSignatureUrl?: string;
  onboardingCompleted?: boolean;
}) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    plan: user.plan ?? "free",
    avatarUrl: user.avatarUrl,
    hasSavedSignature: !!user.savedSignatureUrl,
    savedSignatureUrl: user.savedSignatureUrl,
    onboardingCompleted: !!user.onboardingCompleted,
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RegisterInput;
  const { user, accessToken, refreshToken } = await authService.registerUser(
    input,
    req.file,
  );

  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user: sanitizeUser(user), accessToken });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const { user, accessToken, refreshToken } =
    await authService.loginUser(input);

  setRefreshCookie(res, refreshToken);
  res.status(200).json({ user: sanitizeUser(user), accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const oldToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!oldToken) {
    throw new AppError("No refresh token provided", 401);
  }

  const { accessToken, refreshToken } =
    await authService.refreshTokens(oldToken);

  setRefreshCookie(res, refreshToken);
  res.status(200).json({ accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    await authService.logoutUser(token);
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  res.status(200).json({ message: "Logged out successfully" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  res.status(200).json({ user: sanitizeUser(user) });
});

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as { name?: string };
    const user = await authService.updateProfile(req.user!.id, input);
    res.status(200).json({ user: sanitizeUser(user) });
  },
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as { currentPassword: string; newPassword: string };
    await authService.changePassword(req.user!.id, input);
    res.status(200).json({ message: "Password updated successfully" });
  },
);

export const updateAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }
    const user = await authService.updateProfile(req.user!.id, {
      avatarUrl: req.file.path,
    });
    res.status(200).json({ user: sanitizeUser(user) });
  },
);

export const removeAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await authService.updateProfile(req.user!.id, {
      avatarUrl: undefined,
    });
    res.status(200).json({ user: sanitizeUser(user) });
  },
);
