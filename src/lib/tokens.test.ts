import { beforeEach, describe, expect, it, vi } from "vitest";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { generateToken, getAppUrl, hashToken, wasRecentlySent } from "@/lib/tokens";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: { verificationToken: { findFirst: vi.fn() } },
}));

describe("generateToken", () => {
  it("returns a random 64-character hex string", () => {
    const token = generateToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(generateToken()).not.toBe(token);
  });
});

describe("hashToken", () => {
  it("returns the SHA-256 hex digest", () => {
    expect(hashToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });
});

describe("getAppUrl", () => {
  it("uses AUTH_URL without a trailing slash", async () => {
    vi.stubEnv("AUTH_URL", "https://devstash.io/");
    await expect(getAppUrl()).resolves.toBe("https://devstash.io");
  });

  it("throws in production when AUTH_URL is missing", async () => {
    vi.stubEnv("AUTH_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    await expect(getAppUrl()).rejects.toThrow("AUTH_URL must be set");
  });

  it("builds the URL from request headers in development", async () => {
    vi.stubEnv("AUTH_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.mocked(headers).mockResolvedValue(
      new Headers({ host: "localhost:3000" }) as Awaited<ReturnType<typeof headers>>
    );
    await expect(getAppUrl()).resolves.toBe("http://localhost:3000");
  });
});

describe("wasRecentlySent", () => {
  const TTL_MS = 60 * 60 * 1000;
  const findFirst = vi.mocked(prisma.verificationToken.findFirst);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    return () => vi.useRealTimers();
  });

  it("returns false when no token exists", async () => {
    findFirst.mockResolvedValue(null);
    await expect(wasRecentlySent("dev@example.com", TTL_MS)).resolves.toBe(false);
  });

  it("returns true for a token created under a minute ago", async () => {
    const sentAt = Date.now() - 30 * 1000;
    findFirst.mockResolvedValue({ expires: new Date(sentAt + TTL_MS) } as never);
    await expect(wasRecentlySent("dev@example.com", TTL_MS)).resolves.toBe(true);
  });

  it("returns false for a token created over a minute ago", async () => {
    const sentAt = Date.now() - 2 * 60 * 1000;
    findFirst.mockResolvedValue({ expires: new Date(sentAt + TTL_MS) } as never);
    await expect(wasRecentlySent("dev@example.com", TTL_MS)).resolves.toBe(false);
  });
});
