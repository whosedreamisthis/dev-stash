"use server";

import { ThinkingLevel } from "@google/genai";
import {
  AI_EMPTY_ERROR,
  AI_INVALID_RESPONSE_ERROR,
  AI_MODEL,
  AI_TIMEOUT_MS,
  getAiClient,
  toAiErrorMessage,
} from "@/lib/ai";
import {
  AUTO_TAG_RESPONSE_JSON_SCHEMA,
  AUTO_TAG_SYSTEM_PROMPT,
  buildAutoTagPrompt,
  parseTagSuggestions,
} from "@/lib/ai-tags";
import { checkRateLimit, getRateLimitMessage } from "@/lib/rate-limit";
import { getSessionUser, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import { hasProAccess, PRO_REQUIRED_ERROR } from "@/lib/usage-limits";
import { generateAutoTagsSchema, type GenerateAutoTagsInput } from "@/lib/validations/ai";

export interface AiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  // Lets the client tell rate limits apart from other errors
  rateLimited?: boolean;
}

// Suggests tags for the item as typed in the form; saving them is left to the form
export async function generateAutoTags(
  input: GenerateAutoTagsInput
): Promise<AiResult<string[]>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: NOT_SIGNED_IN_ERROR };
  // Checked before anything that costs money
  if (!hasProAccess(user)) return { success: false, error: PRO_REQUIRED_ERROR };

  const parsed = generateAutoTagsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid item." };
  }

  const limit = await checkRateLimit("ai", user.id);
  if (!limit.success) {
    return { success: false, rateLimited: true, error: getRateLimitMessage(limit.reset) };
  }

  try {
    const response = await getAiClient().models.generateContent({
      model: AI_MODEL,
      contents: buildAutoTagPrompt(parsed.data),
      config: {
        systemInstruction: AUTO_TAG_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: AUTO_TAG_RESPONSE_JSON_SCHEMA,
        maxOutputTokens: 200,
        temperature: 0.3,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
      },
    });

    // Empty when nothing was generated, e.g. a safety filter blocked the prompt
    const text = response.text;
    if (!text) return { success: false, error: AI_EMPTY_ERROR };

    const tags = parseTagSuggestions(text, parsed.data.tags);
    if (!tags) return { success: false, error: AI_INVALID_RESPONSE_ERROR };

    return { success: true, data: tags };
  } catch (error) {
    console.error("Generating auto tags failed:", error);
    return { success: false, error: toAiErrorMessage(error) };
  }
}
