import { describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { getSessionUser, getSessionUserId } from "@/lib/session";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const mockAuth = vi.mocked(auth as () => Promise<unknown>);

describe("getSessionUserId", () => {
  it("returns the signed-in user's ID", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    await expect(getSessionUserId()).resolves.toBe("user-1");
  });

  it("returns null when there's no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getSessionUserId()).resolves.toBeNull();
  });

  it("returns null when the session has no user ID", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    await expect(getSessionUserId()).resolves.toBeNull();
  });
});

describe("getSessionUser", () => {
  it("returns null when there's no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getSessionUser()).resolves.toBeNull();
  });

  it.each([true, false])("returns the user's ID and isPro %s", async (isPro) => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro } });
    await expect(getSessionUser()).resolves.toEqual({ id: "user-1", isPro });
  });
});
