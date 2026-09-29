import { ApiError, GoogleGenAI } from "@google/genai";

export const AI_MODEL = "gemini-3.8-flash";

// Long enough for a short answer; a stuck request returns an error instead of hanging
export const AI_TIMEOUT_MS = 30_000;

export const AI_BUSY_ERROR =
  "AI is busy right now. Please try again in a minute.";
export const AI_UNAVAILABLE_ERROR =
  "AI is temporarily unavailable. Please try again.";
export const AI_TIMEOUT_ERROR =
  "The AI took too long to respond. Please try again.";
export const AI_EMPTY_ERROR = "The AI couldn't process this content.";
export const AI_INVALID_RESPONSE_ERROR =
  "The AI returned an unexpected response. Please try again.";
export const AI_GENERIC_ERROR =
  "Something went wrong with the AI. Please try again.";

let client: GoogleGenAI | null = null;

// Created on first use so a missing key doesn't break imports or the build
export function getAiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// A user-facing message for a failed Gemini call; raw errors are only logged
export function toAiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // 429: the project's shared Gemini quota is used up
    if (error.status === 429) return AI_BUSY_ERROR;
    if (error.status >= 500) return AI_UNAVAILABLE_ERROR;
  }
  if (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  ) {
    return AI_TIMEOUT_ERROR;
  }
  return AI_GENERIC_ERROR;
}
