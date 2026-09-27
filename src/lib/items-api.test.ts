import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchItemDetail, ITEM_LOAD_ERROR } from "@/lib/items-api";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchItemDetail", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    return () => vi.unstubAllGlobals();
  });

  it("requests the item by its encoded ID", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: false, error: "x" }, 404));
    await fetchItemDetail("a/b").catch(() => {});
    expect(fetchMock).toHaveBeenCalledWith("/api/items/a%2Fb");
  });

  it("returns the item with its dates revived", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          id: "item-1",
          title: "useAuth Hook",
          createdAt: "2026-01-15T10:00:00.000Z",
          updatedAt: "2026-01-16T10:00:00.000Z",
        },
      })
    );
    const item = await fetchItemDetail("item-1");
    expect(item.title).toBe("useAuth Hook");
    expect(item.createdAt).toEqual(new Date("2026-01-15T10:00:00.000Z"));
    expect(item.updatedAt).toEqual(new Date("2026-01-16T10:00:00.000Z"));
  });

  it("throws the API's error message", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: false, error: "Item not found" }, 404));
    await expect(fetchItemDetail("item-1")).rejects.toThrow("Item not found");
  });

  it("throws a generic error for non-JSON responses", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 }));
    await expect(fetchItemDetail("item-1")).rejects.toThrow(ITEM_LOAD_ERROR);
  });

  it("propagates network failures", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(fetchItemDetail("item-1")).rejects.toThrow("Failed to fetch");
  });
});
