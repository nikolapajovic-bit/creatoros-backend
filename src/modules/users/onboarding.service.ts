import { User } from "@/modules/users/user.model";
import { AppError } from "@/utils/AppError";
import type { CompleteOnboardingInput } from "@/modules/users/onboarding.validation";

export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string,
): Promise<boolean> {
  const query: Record<string, unknown> = { username: username.toLowerCase() };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const existing = await User.findOne(query);
  return !existing;
}

export async function completeOnboarding(
  userId: string,
  input: CompleteOnboardingInput,
) {
  const available = await isUsernameAvailable(input.username, userId);
  if (!available) {
    throw new AppError("This username is already taken", 409);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        username: input.username.toLowerCase(),
        onboardingAnswers: input.answers,
        onboardingCompleted: true,
      },
    },
    { new: true },
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}
