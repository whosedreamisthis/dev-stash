import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUploadToken, verifyUploadToken } from "@/lib/upload-token";

const FILE = {
  typeSlug: "files" as const,
  key: "abc_notes.md",
  name: "notes.md",
  size: 1200,
  mimeType: "text/markdown",
};

describe("upload tokens", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
  });

  it("round-trips the file for the same user", () => {
    const token = createUploadToken("user-1", FILE);
    expect(verifyUploadToken("user-1", token)).toEqual(FILE);
  });

  it("rejects another user's token", () => {
    const token = createUploadToken("user-1", FILE);
    expect(verifyUploadToken("user-2", token)).toBeNull();
  });

  it("rejects a token whose payload was changed", () => {
    const [, signature] = createUploadToken("user-1", FILE).split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...FILE, key: "someone-elses-file", userId: "user-1", expiresAt: Date.now() + 60_000 })
    ).toString("base64url");
    expect(verifyUploadToken("user-1", `${forged}.${signature}`)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyUploadToken("user-1", "")).toBeNull();
    expect(verifyUploadToken("user-1", "abc")).toBeNull();
    expect(verifyUploadToken("user-1", "a.b.c")).toBeNull();
  });

  it("rejects tokens signed with a different secret", () => {
    const token = createUploadToken("user-1", FILE);
    vi.stubEnv("AUTH_SECRET", "other-secret");
    expect(verifyUploadToken("user-1", token)).toBeNull();
  });

  it("rejects expired tokens", () => {
    vi.useFakeTimers();
    try {
      const token = createUploadToken("user-1", FILE);
      vi.advanceTimersByTime(60 * 60 * 1000 + 1);
      expect(verifyUploadToken("user-1", token)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws when AUTH_SECRET is missing", () => {
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => createUploadToken("user-1", FILE)).toThrow("AUTH_SECRET");
  });
});
