import { describe, expect, it } from "vitest";
import {
  getCollectionKeywords,
  getItemKeywords,
  isMacPlatform,
  SEARCH_PREVIEW_LENGTH,
  toContentPreview,
} from "@/lib/search";
import type { CollectionSummary } from "@/types/collections";
import type { SearchItem } from "@/types/search";

describe("toContentPreview", () => {
  it("returns null for missing or blank content", () => {
    expect(toContentPreview(null)).toBeNull();
    expect(toContentPreview("  \n\t ")).toBeNull();
  });

  it("collapses whitespace onto one line", () => {
    expect(toContentPreview("  git reset\n  --hard\tHEAD  ")).toBe("git reset --hard HEAD");
  });

  it("shortens long content with an ellipsis", () => {
    const preview = toContentPreview("a".repeat(SEARCH_PREVIEW_LENGTH + 10));
    expect(preview).toBe(`${"a".repeat(SEARCH_PREVIEW_LENGTH)}…`);
  });

  it("keeps content at the limit unchanged", () => {
    const text = "a".repeat(SEARCH_PREVIEW_LENGTH);
    expect(toContentPreview(text)).toBe(text);
  });
});

describe("getItemKeywords", () => {
  it("lists the item's searchable text and skips empty fields", () => {
    const item = {
      title: "useDebounce",
      type: { name: "Snippet" },
      tags: ["react", "hooks"],
      description: null,
      fileName: null,
      contentPreview: "export function useDebounce",
    } as SearchItem;

    expect(getItemKeywords(item)).toEqual([
      "useDebounce",
      "Snippet",
      "react",
      "hooks",
      "export function useDebounce",
    ]);
  });
});

describe("getCollectionKeywords", () => {
  it("lists the name and description when there is one", () => {
    const collection = { name: "React Patterns", description: "Hooks" } as CollectionSummary;
    expect(getCollectionKeywords(collection)).toEqual(["React Patterns", "Hooks"]);
    expect(getCollectionKeywords({ ...collection, description: null })).toEqual([
      "React Patterns",
    ]);
  });
});

describe("isMacPlatform", () => {
  it("detects Apple devices", () => {
    expect(isMacPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(true);
    expect(isMacPlatform("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe(true);
  });

  it("returns false for other platforms", () => {
    expect(isMacPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
    expect(isMacPlatform("Mozilla/5.0 (X11; Linux x86_64)")).toBe(false);
  });
});
