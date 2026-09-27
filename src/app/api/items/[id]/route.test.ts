import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";
import type { ItemDetail } from "@/types/items";
import { GET } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/items", () => ({ getItemDetail: vi.fn() }));

// auth() is overloaded (it also wraps middleware), so narrow it to the session getter
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

function callGet(id: string) {
  return GET(new Request(`http://localhost/api/items/${id}`), {
    params: Promise.resolve({ id }),
  });
}

function signIn(userId = "user-1") {
  mockAuth.mockResolvedValue({ user: { id: userId }, expires: "" } as Session);
}

describe("GET /api/items/[id]", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 401 without a session", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await callGet("item-1");
    expect(response.status).toBe(401);
    expect(getItemDetail).not.toHaveBeenCalled();
  });

  it("returns 404 when the item isn't the user's", async () => {
    signIn("user-1");
    vi.mocked(getItemDetail).mockResolvedValue(null);
    const response = await callGet("item-1");
    expect(response.status).toBe(404);
    expect(getItemDetail).toHaveBeenCalledWith("user-1", "item-1");
  });

  it("returns the item for its owner", async () => {
    signIn("user-1");
    const item = { id: "item-1", title: "useAuth Hook" } as ItemDetail;
    vi.mocked(getItemDetail).mockResolvedValue(item);
    const response = await callGet("item-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: item });
  });

  it("returns 500 when the lookup fails", async () => {
    signIn();
    vi.mocked(getItemDetail).mockRejectedValue(new Error("db down"));
    const response = await callGet("item-1");
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });
});
