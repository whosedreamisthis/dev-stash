import { beforeEach, describe, expect, it, vi } from "vitest";
import { countCollections } from "@/lib/db/collections";
import { getItemStats } from "@/lib/db/items";
import {
  checkCollectionLimit,
  checkItemLimit,
  COLLECTION_LIMIT_ERROR,
  FREE_LIMITS,
  hasProAccess,
  isAtLimit,
  ITEM_LIMIT_ERROR,
} from "@/lib/usage-limits";

vi.mock("@/lib/db/collections", () => ({ countCollections: vi.fn() }));
vi.mock("@/lib/db/items", () => ({ getItemStats: vi.fn() }));

const mockCountCollections = vi.mocked(countCollections);
const mockGetItemStats = vi.mocked(getItemStats);

const FREE_USER = { id: "user-1", isPro: false };
const PRO_USER = { id: "user-2", isPro: true };

function enforcePlans() {
  vi.stubEnv("ENFORCE_PLANS", "true");
}

describe("hasProAccess", () => {
  it("gives free users Pro access when ENFORCE_PLANS is unset", () => {
    expect(hasProAccess(FREE_USER)).toBe(true);
  });

  it("follows isPro when ENFORCE_PLANS is true", () => {
    enforcePlans();
    expect(hasProAccess(FREE_USER)).toBe(false);
    expect(hasProAccess(PRO_USER)).toBe(true);
  });

  it.each(["false", "1", ""])("gives Pro access when ENFORCE_PLANS is %j", (value) => {
    vi.stubEnv("ENFORCE_PLANS", value);
    expect(hasProAccess(FREE_USER)).toBe(true);
  });
});

describe("isAtLimit", () => {
  it("compares the count to the limit for free users when enforced", () => {
    enforcePlans();
    expect(isAtLimit(FREE_USER, 2, 3)).toBe(false);
    expect(isAtLimit(FREE_USER, 3, 3)).toBe(true);
    expect(isAtLimit(FREE_USER, 4, 3)).toBe(true);
  });

  it("is never at the limit for Pro users", () => {
    enforcePlans();
    expect(isAtLimit(PRO_USER, 100, 3)).toBe(false);
  });

  it("is never at the limit when plans aren't enforced", () => {
    expect(isAtLimit(FREE_USER, 100, 3)).toBe(false);
  });
});

describe("checkItemLimit", () => {
  beforeEach(enforcePlans);

  it("returns null under the limit", async () => {
    mockGetItemStats.mockResolvedValue({ total: FREE_LIMITS.items - 1, favorites: 0 });
    await expect(checkItemLimit(FREE_USER)).resolves.toBeNull();
    expect(mockGetItemStats).toHaveBeenCalledWith("user-1");
  });

  it("returns the item limit error at the limit", async () => {
    mockGetItemStats.mockResolvedValue({ total: FREE_LIMITS.items, favorites: 0 });
    await expect(checkItemLimit(FREE_USER)).resolves.toBe(ITEM_LIMIT_ERROR);
  });

  it("returns null for Pro users without counting items", async () => {
    await expect(checkItemLimit(PRO_USER)).resolves.toBeNull();
    expect(mockGetItemStats).not.toHaveBeenCalled();
  });

  it("doesn't count items when plans aren't enforced", async () => {
    vi.stubEnv("ENFORCE_PLANS", "");
    await expect(checkItemLimit(FREE_USER)).resolves.toBeNull();
    expect(mockGetItemStats).not.toHaveBeenCalled();
  });
});

describe("checkCollectionLimit", () => {
  beforeEach(enforcePlans);

  it("returns null under the limit", async () => {
    mockCountCollections.mockResolvedValue(FREE_LIMITS.collections - 1);
    await expect(checkCollectionLimit(FREE_USER)).resolves.toBeNull();
    expect(mockCountCollections).toHaveBeenCalledWith("user-1");
  });

  it("returns the collection limit error at the limit", async () => {
    mockCountCollections.mockResolvedValue(FREE_LIMITS.collections);
    await expect(checkCollectionLimit(FREE_USER)).resolves.toBe(COLLECTION_LIMIT_ERROR);
  });

  it("returns null for Pro users without counting collections", async () => {
    await expect(checkCollectionLimit(PRO_USER)).resolves.toBeNull();
    expect(mockCountCollections).not.toHaveBeenCalled();
  });

  it("doesn't count collections when plans aren't enforced", async () => {
    vi.stubEnv("ENFORCE_PLANS", "");
    await expect(checkCollectionLimit(FREE_USER)).resolves.toBeNull();
    expect(mockCountCollections).not.toHaveBeenCalled();
  });
});

describe("limit errors", () => {
  it("include the free limits", () => {
    expect(ITEM_LIMIT_ERROR).toContain(String(FREE_LIMITS.items));
    expect(COLLECTION_LIMIT_ERROR).toContain(String(FREE_LIMITS.collections));
  });
});
