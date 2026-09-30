import { describe, expect, it } from "vitest";
import {
  getCollectionKeywords,
  getItemKeywords,
  isMacPlatform,
  scoreSearchMatch,
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

  it("includes the language label and ID so a language search finds the item", () => {
    const item = {
      title: "Parse CSV",
      type: { name: "Snippet" },
      tags: [],
      language: "ts",
    } as unknown as SearchItem;

    const keywords = getItemKeywords(item);
    expect(keywords).toEqual(["Parse CSV", "Snippet", "TypeScript", "ts"]);
    expect(scoreSearchMatch(keywords, "TypeScript")).toBeGreaterThan(0);
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

describe("scoreSearchMatch", () => {
  const keywords = ["useDebounce hook", "Snippet", "react", "export function useDebounce"];

  it("hides results whose letters only appear scattered through the text", () => {
    expect(scoreSearchMatch(["Payment types", "Snippet", "export const total = 0; // hello again"], "python")).toBe(0);
  });

  it("matches case-insensitively", () => {
    expect(scoreSearchMatch(["Parse CSV", "Snippet", "Python"], "PYTHON")).toBeGreaterThan(0);
  });

  it("requires every word, in any order", () => {
    expect(scoreSearchMatch(keywords, "react snippet")).toBeGreaterThan(0);
    expect(scoreSearchMatch(keywords, "react python")).toBe(0);
  });

  it("scores a title prefix highest", () => {
    expect(scoreSearchMatch(keywords, "usedeb")).toBe(1);
    expect(scoreSearchMatch(keywords, "  useDebounce   hook ")).toBe(1);
  });

  it("ranks title matches above type, tag and content matches", () => {
    const title = scoreSearchMatch(["My python script", "Snippet", "misc"], "python");
    const tag = scoreSearchMatch(["Parse CSV", "Snippet", "python"], "python");
    const content = scoreSearchMatch(["Parse CSV", "Snippet", "misc", "import python_lib"], "python");

    expect(title).toBeLessThan(1);
    expect(title).toBeGreaterThan(tag);
    expect(tag).toBeGreaterThan(content);
  });

  it("shows everything for an empty search", () => {
    expect(scoreSearchMatch(keywords, "   ")).toBe(1);
  });

  it("hides results with no keywords", () => {
    expect(scoreSearchMatch([], "python")).toBe(0);
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
