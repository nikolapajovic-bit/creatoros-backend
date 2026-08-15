import { z } from "zod";

export const checkUsernameSchema = z.object({
  query: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30)
      .regex(
        /^[a-z0-9_]+$/,
        "Only lowercase letters, numbers, and underscores allowed",
      ),
  }),
});

export const completeOnboardingSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30)
      .regex(
        /^[a-z0-9_]+$/,
        "Only lowercase letters, numbers, and underscores allowed",
      ),
    answers: z.object({
      platform: z.string().optional(),
      goal: z.string().optional(),
      painPoint: z.string().optional(),
    }),
  }),
});

export type CompleteOnboardingInput = z.infer<
  typeof completeOnboardingSchema
>["body"];
