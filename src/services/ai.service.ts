import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";
import type { AiTool } from "@/modules/ai/ai.validation";

const SYSTEM_PROMPTS: Record<AiTool, string> = {
  caption:
    "You are a social media caption writer for a content creator. Write one engaging, natural-sounding caption based on the user's description. Keep it authentic, not overly salesy. Output only the caption text, no preamble or explanation.",
  ideas:
    "You are a content strategist helping a creator brainstorm. Given a topic or niche, generate 5 concrete content ideas as a numbered list. Each idea should be a specific, actionable angle or hook, not a generic suggestion.",
  hashtags:
    "You are a social media growth expert. Given a description of content, generate 10 relevant hashtags for reach and discoverability. Mix broad and niche tags. Output only the hashtags separated by spaces, starting each with #.",
  "email-reply":
    "You are helping a content creator draft a professional but warm email reply to a brand. Given the context, write a complete, ready-to-send email reply. Keep it concise, friendly, and professional. Output only the email body, no subject line.",
};

const MOCK_RESPONSES: Record<AiTool, string> = {
  caption:
    "Mornings hit different when your skin is glowing before your coffee even kicks in ☀️ [MOCK — connect GEMINI_API_KEY for real generations]",
  ideas:
    "1. 'What $50/day actually gets you' — budget breakdown series\n2. Behind-the-scenes packing video with cost commentary\n3. 'I tried the cheapest vs. most expensive version' comparison\n[MOCK — connect GEMINI_API_KEY for real generations]",
  hashtags:
    "#contentcreator #creatorlife #dayinthelife [MOCK — connect GEMINI_API_KEY]",
  "email-reply":
    "Hi there,\n\nThanks so much for reaching out — I'd love to hear more details!\n\n[MOCK — connect GEMINI_API_KEY for real generations]",
};

// Lazy-loaded, jednom keširan klijent — @google/genai je ESM-only paket,
// pa se učitava preko dinamičkog import() umesto standardnog CommonJS require-a.
let genaiClientPromise: Promise<any> | null = null;

async function getGenaiClient() {
  if (!genaiClientPromise) {
    genaiClientPromise = import("@google/genai").then(
      ({ GoogleGenAI }) => new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }),
    );
  }
  return genaiClientPromise;
}

export async function generateContent(
  tool: AiTool,
  prompt: string,
): Promise<string> {
  if (env.AI_MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_RESPONSES[tool];
  }

  try {
    const genai = await getGenaiClient();
    const response = await genai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPTS[tool],
        maxOutputTokens: 500,
      },
    });

    const text = response.text;
    if (!text) {
      throw new AppError("AI service returned an empty response", 502);
    }

    return text;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("AI generation error:", error);
    throw new AppError("Failed to generate content. Please try again.", 502);
  }
}
