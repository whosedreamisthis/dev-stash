import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { getSearchCollections } from "@/lib/db/collections";
import { getSearchItems } from "@/lib/db/items";
import { getSearchData } from "@/actions/search";
import type { CollectionSummary } from "@/types/collections";
import type { SearchItem } from "@/types/search";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/collections", () => ({ getSearchCollections: vi.fn() }));
vi.mock("@/lib/db/items", () => ({ getSearchItems: vi.fn() }));

// auth() is overloaded (it also wraps middleware), so narrow it to the session getter
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

function signIn(userId = "user-1") {
  mockAuth.mockResolvedValue({ user: { id: userId }, expires: "" } as Session);
}

const ITEM = { id: "i1", title: "useDebounce" } as SearchItem;
const COLLECTION = { id: "c1", name: "React Patterns", itemCount: 3 } as CollectionSummary;

describe("getSearchData", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getSearchData()).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(getSearchItems).not.toHaveBeenCalled();
    expect(getSearchCollections).not.toHaveBeenCalled();
  });

  it("returns the session user's items and collections", async () => {
    signIn("user-42");
    vi.mocked(getSearchItems).mockResolvedValue([ITEM]);
    vi.mocked(getSearchCollections).mockResolvedValue([COLLECTION]);
    await expect(getSearchData()).resolves.toEqual({
      success: true,
      data: { items: [ITEM], collections: [COLLECTION] },
    });
    expect(getSearchItems).toHaveBeenCalledWith("user-42");
    expect(getSearchCollections).toHaveBeenCalledWith("user-42");
  });

  it("returns an error when a lookup fails", async () => {
    signIn();
    vi.mocked(getSearchItems).mockRejectedValue(new Error("db down"));
    vi.mocked(getSearchCollections).mockResolvedValue([]);
    await expect(getSearchData()).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
