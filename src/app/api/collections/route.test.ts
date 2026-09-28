import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { getCollectionOptions } from "@/lib/db/collections";
import { GET } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/collections", () => ({ getCollectionOptions: vi.fn() }));

// auth() is overloaded (it also wraps middleware), so narrow it to the session getter
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

function signIn(userId = "user-1") {
  mockAuth.mockResolvedValue({ user: { id: userId }, expires: "" } as Session);
}

describe("GET /api/collections", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 401 without a session", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(getCollectionOptions).not.toHaveBeenCalled();
  });

  it("returns the session user's collections", async () => {
    signIn("user-42");
    const collections = [{ id: "c1", name: "React Patterns" }];
    vi.mocked(getCollectionOptions).mockResolvedValue(collections);
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: collections });
    expect(getCollectionOptions).toHaveBeenCalledWith("user-42");
  });

  it("returns 500 when the lookup fails", async () => {
    signIn();
    vi.mocked(getCollectionOptions).mockRejectedValue(new Error("db down"));
    const response = await GET();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });
});
