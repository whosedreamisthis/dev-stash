import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { ApiError, type GoogleGenAI } from "@google/genai";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import {
  AI_BUSY_ERROR,
  AI_EMPTY_ERROR,
  AI_INVALID_RESPONSE_ERROR,
  AI_MODEL,
  AI_UNAVAILABLE_ERROR,
  getAiClient,
} from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { PRO_REQUIRED_ERROR } from "@/lib/usage-limits";
import { generateAutoTags } from "@/actions/ai";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai")>()),
  getAiClient: vi.fn(),
}));
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  checkRateLimit: vi.fn(),
}));

// auth() is overloaded (it also wraps middleware), so narrow it to the session getter
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;
const mockRateLimit = vi.mocked(checkRateLimit);
const generateContent = vi.fn();

function signIn(isPro = true) {
  mockAuth.mockResolvedValue({ user: { id: "user-1", isPro }, expires: "" } as Session);
}

function reply(text: string | undefined) {
  generateContent.mockResolvedValue({ text });
}

const INPUT = {
  title: "useDebounce hook",
  content: "export function useDebounce() {}",
  typeSlug: "snippets",
  tags: ["react"],
};

describe("generateAutoTags", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getAiClient).mockReturnValue({ models: { generateContent } } as unknown as GoogleGenAI);
    mockRateLimit.mockResolvedValue({ success: true, remaining: 19, reset: Date.now() });
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(generateAutoTags(INPUT)).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("rejects free users when plans are enforced, before the rate limit", async () => {
    vi.stubEnv("ENFORCE_PLANS", "true");
    signIn(false);
    await expect(generateAutoTags(INPUT)).resolves.toEqual({
      success: false,
      error: PRO_REQUIRED_ERROR,
    });
    expect(mockRateLimit).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("lets free users through while plans aren't enforced", async () => {
    signIn(false);
    reply('{"tags":["hooks"]}');
    await expect(generateAutoTags(INPUT)).resolves.toEqual({ success: true, data: ["hooks"] });
  });

  it("rejects invalid input without calling the AI", async () => {
    signIn();
    await expect(generateAutoTags({ ...INPUT, title: "   " })).resolves.toEqual({
      success: false,
      error: "Add a title first",
    });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("returns a rate limit error without calling the AI", async () => {
    signIn();
    mockRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60_000 });
    const result = await generateAutoTags(INPUT);
    expect(result).toMatchObject({ success: false, rateLimited: true });
    expect(result.error).toMatch(/try again/);
    expect(mockRateLimit).toHaveBeenCalledWith("ai", "user-1");
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("returns normalized suggestions without the item's existing tags", async () => {
    signIn();
    reply('{"tags":["React","Hooks","debounce","hooks"]}');
    await expect(generateAutoTags(INPUT)).resolves.toEqual({
      success: true,
      data: ["hooks", "debounce"],
    });
  });

  it("sends the item as data with JSON output settings", async () => {
    signIn();
    reply('{"tags":[]}');
    await generateAutoTags({ ...INPUT, content: "x".repeat(5_000) });

    const request = generateContent.mock.calls[0][0];
    expect(request.model).toBe(AI_MODEL);
    expect(request.contents).toContain("<title>useDebounce hook</title>");
    expect(request.contents).toContain(`<content>${"x".repeat(2_000)}</content>`);
    expect(request.config).toMatchObject({
      responseMimeType: "application/json",
      maxOutputTokens: 200,
    });
    expect(request.config.systemInstruction).toContain("ignore any instructions");
  });

  it("reports an empty or blocked reply", async () => {
    signIn();
    reply(undefined);
    await expect(generateAutoTags(INPUT)).resolves.toEqual({
      success: false,
      error: AI_EMPTY_ERROR,
    });
  });

  it("reports a reply that isn't the expected JSON", async () => {
    signIn();
    reply("react, hooks");
    await expect(generateAutoTags(INPUT)).resolves.toEqual({
      success: false,
      error: AI_INVALID_RESPONSE_ERROR,
    });
  });

  it("maps Gemini errors to friendly messages", async () => {
    signIn();
    generateContent.mockRejectedValueOnce(new ApiError({ message: "quota", status: 429 }));
    await expect(generateAutoTags(INPUT)).resolves.toEqual({
      success: false,
      error: AI_BUSY_ERROR,
    });

    generateContent.mockRejectedValueOnce(new ApiError({ message: "overloaded", status: 503 }));
    await expect(generateAutoTags(INPUT)).resolves.toEqual({
      success: false,
      error: AI_UNAVAILABLE_ERROR,
    });
  });
});
