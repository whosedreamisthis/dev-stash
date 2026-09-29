import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@google/genai";
import {
  AI_BUSY_ERROR,
  AI_GENERIC_ERROR,
  AI_TIMEOUT_ERROR,
  AI_UNAVAILABLE_ERROR,
  getAiClient,
  toAiErrorMessage,
} from "@/lib/ai";

describe("toAiErrorMessage", () => {
  it("maps a used-up quota to the busy message", () => {
    expect(toAiErrorMessage(new ApiError({ message: "RESOURCE_EXHAUSTED", status: 429 }))).toBe(
      AI_BUSY_ERROR
    );
  });

  it("maps server errors to the unavailable message", () => {
    expect(toAiErrorMessage(new ApiError({ message: "overloaded", status: 503 }))).toBe(
      AI_UNAVAILABLE_ERROR
    );
  });

  it("maps timeouts and aborts to the timeout message", () => {
    expect(toAiErrorMessage(new DOMException("timed out", "TimeoutError"))).toBe(AI_TIMEOUT_ERROR);
    expect(toAiErrorMessage(new DOMException("aborted", "AbortError"))).toBe(AI_TIMEOUT_ERROR);
  });

  it("uses a generic message for anything else, including bad requests", () => {
    expect(toAiErrorMessage(new ApiError({ message: "bad key", status: 400 }))).toBe(
      AI_GENERIC_ERROR
    );
    expect(toAiErrorMessage(new Error("boom"))).toBe(AI_GENERIC_ERROR);
    expect(toAiErrorMessage("boom")).toBe(AI_GENERIC_ERROR);
  });
});

describe("getAiClient", () => {
  it("throws when the API key isn't set", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(() => getAiClient()).toThrow("GEMINI_API_KEY is not set");
  });
});
