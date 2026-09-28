import { beforeEach, describe, expect, it, vi } from "vitest";
import { COLLECTIONS_LOAD_ERROR, fetchCollectionOptions } from "@/lib/collections-api";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchCollectionOptions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    return () => vi.unstubAllGlobals();
  });

  it("returns the collections from the API", async () => {
    const collections = [{ id: "c1", name: "React Patterns" }];
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: collections }));
    await expect(fetchCollectionOptions()).resolves.toEqual(collections);
    expect(fetchMock).toHaveBeenCalledWith("/api/collections");
  });

  it("throws the API's error message", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, error: "You must be signed in." }, 401)
    );
    await expect(fetchCollectionOptions()).rejects.toThrow("You must be signed in.");
  });

  it("throws a generic error for non-JSON responses", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 }));
    await expect(fetchCollectionOptions()).rejects.toThrow(COLLECTIONS_LOAD_ERROR);
  });
});
