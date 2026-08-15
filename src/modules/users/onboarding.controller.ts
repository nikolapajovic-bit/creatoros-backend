import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as onboardingService from "@/modules/users/onboarding.service";
import type { CompleteOnboardingInput } from "@/modules/users/onboarding.validation";
import { User } from "@/modules/users/user.model";

export const checkUsername = asyncHandler(
  async (req: Request, res: Response) => {
    const username = req.query.username as string;
    const available = await onboardingService.isUsernameAvailable(
      username,
      req.user!.id,
    );
    res.status(200).json({ available });
  },
);

export const completeOnboarding = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as CompleteOnboardingInput;
    const user = await onboardingService.completeOnboarding(
      req.user!.id,
      input,
    );
    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        plan: user.plan,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  },
);

// Mock checkout — trenutno besplatno "kupuje" Pro plan, kasnije zamenjujemo pravim Stripe pozivom
export const mockUpgradeToPro = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $set: { plan: "pro" } },
      { new: true },
    );
    res.status(200).json({
      user: {
        id: user!._id,
        plan: user!.plan,
      },
    });
  },
);
