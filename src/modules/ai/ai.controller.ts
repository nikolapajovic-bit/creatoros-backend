import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { generateContent } from "@/services/ai.service";
import type { GenerateInput } from "@/modules/ai/ai.validation";

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const { tool, prompt } = req.body as GenerateInput;
  const result = await generateContent(tool, prompt);
  res.status(200).json({ result });
});
