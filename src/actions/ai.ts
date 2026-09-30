"use server";

import { ThinkingLevel, type ContentListUnion, type GenerateContentConfig } from "@google/genai";
import type { z } from "zod";
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
import {
  buildDescriptionPrompt,
  cleanDescription,
  DESCRIPTION_SYSTEM_PROMPT,
} from "@/lib/ai-description";
import { checkRateLimit, getRateLimitMessage } from "@/lib/rate-limit";
import { getSessionUser, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import { hasProAccess, PRO_REQUIRED_ERROR } from "@/lib/usage-limits";
import { firstIssueMessage } from "@/lib/validations/errors";
import {
  generateAutoTagsSchema,
  generateDescriptionSchema,
  type GenerateAutoTagsInput,
  type GenerateDescriptionInput,
} from "@/lib/validations/ai";
import type { ActionResult } from "@/types/actions";

export interface AiResult<T> extends ActionResult<T> {
  // Lets the client tell rate limits apart from other errors
  rateLimited?: boolean;
}

interface AiRequest {
  contents: ContentListUnion;
  // Feature-specific settings; the model, token cap, thinking level and timeout are shared
  config: Pick<
    GenerateContentConfig,
    "systemInstruction" | "responseMimeType" | "responseJsonSchema" | "temperature"
  >;
}

interface RunAiActionOptions<S extends z.ZodType, T> {
  schema: S;
  input: unknown;
  // Logged as "<logLabel> failed:"
  logLabel: string;
  request: (data: z.output<S>) => AiRequest;
  // Returns null when the response can't be used
  parse: (text: string, data: z.output<S>) => T | null;
}

// Pro check, validation, rate limit and the Gemini call shared by the AI features
async function runAiAction<S extends z.ZodType, T>({
  schema,
  input,
  logLabel,
  request,
  parse,
}: RunAiActionOptions<S, T>): Promise<AiResult<T>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: NOT_SIGNED_IN_ERROR };
  // Checked before anything that costs money
  if (!hasProAccess(user)) return { success: false, error: PRO_REQUIRED_ERROR };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstIssueMessage(parsed.error, "Invalid item.") };
  }

  const limit = await checkRateLimit("ai", user.id);
  if (!limit.success) {
    return { success: false, rateLimited: true, error: getRateLimitMessage(limit.reset) };
  }

  try {
    const { contents, config } = request(parsed.data);
    const response = await getAiClient().models.generateContent({
      model: AI_MODEL,
      contents,
      config: {
        ...config,
        maxOutputTokens: 200,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
      },
    });

    // Empty when nothing was generated, e.g. a safety filter blocked the prompt
    const text = response.text;
    if (!text) return { success: false, error: AI_EMPTY_ERROR };

    const result = parse(text, parsed.data);
    if (!result) return { success: false, error: AI_INVALID_RESPONSE_ERROR };

    return { success: true, data: result };
  } catch (error) {
    console.error(`${logLabel} failed:`, error);
    return { success: false, error: toAiErrorMessage(error) };
  }
}

// Suggests tags for the item as typed in the form; saving them is left to the form
export async function generateAutoTags(
  input: GenerateAutoTagsInput
): Promise<AiResult<string[]>> {
  return runAiAction({
    schema: generateAutoTagsSchema,
    input,
    logLabel: "Generating auto tags",
    request: (data) => ({
      contents: buildAutoTagPrompt(data),
      config: {
        systemInstruction: AUTO_TAG_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: AUTO_TAG_RESPONSE_JSON_SCHEMA,
        temperature: 0.3,
      },
    }),
    parse: (text, data) => parseTagSuggestions(text, data.tags),
  });
}

// Writes a short description of the item as typed in the form; saving it is left to the form
export async function generateDescription(
  input: GenerateDescriptionInput
): Promise<AiResult<string>> {
  return runAiAction({
    schema: generateDescriptionSchema,
    input,
    logLabel: "Generating description",
    request: (data) => ({
      contents: buildDescriptionPrompt(data),
      config: { systemInstruction: DESCRIPTION_SYSTEM_PROMPT, temperature: 0.4 },
    }),
    parse: (text) => cleanDescription(text),
  });
}
