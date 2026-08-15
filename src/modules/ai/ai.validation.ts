import { z } from "zod";

export const AI_TOOLS = [
  "caption",
  "ideas",
  "hashtags",
  "email-reply",
] as const;
export type AiTool = (typeof AI_TOOLS)[number];

export const generateSchema = z.object({
  body: z.object({
    tool: z.enum(AI_TOOLS),
    prompt: z.string().min(1, "Prompt is required").max(2000),
  }),
});

export type GenerateInput = z.infer<typeof generateSchema>["body"];
