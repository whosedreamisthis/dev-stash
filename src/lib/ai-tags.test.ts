import { describe, expect, it } from "vitest";
import {
  AUTO_TAG_LIMITS,
  AUTO_TAG_RESPONSE_JSON_SCHEMA,
  buildAutoTagPrompt,
  normalizeTagSuggestions,
  parseTagSuggestions,
} from "@/lib/ai-tags";

describe("buildAutoTagPrompt", () => {
  it("wraps the item in delimiters", () => {
    expect(buildAutoTagPrompt({ title: "useAuth", content: "const a = 1;", typeSlug: "snippets" }))
      .toBe("<item_type>snippets</item_type>\n<title>useAuth</title>\n<content>const a = 1;</content>");
  });

  it("truncates long content and handles missing content", () => {
    const content = "x".repeat(AUTO_TAG_LIMITS.content + 500);
    const prompt = buildAutoTagPrompt({ title: "Long", content, typeSlug: "notes" });
    expect(prompt).toContain(`<content>${"x".repeat(AUTO_TAG_LIMITS.content)}</content>`);
    expect(buildAutoTagPrompt({ title: "Link", content: null, typeSlug: "links" })).toContain(
      "<content></content>"
    );
  });
});

describe("normalizeTagSuggestions", () => {
  it("trims, lowercases and dedupes tags", () => {
    expect(normalizeTagSuggestions([" React ", "react", "Hooks"], [])).toEqual(["react", "hooks"]);
  });

  it("drops empty, too long and existing tags", () => {
    expect(normalizeTagSuggestions(["", "a".repeat(51), "React", "api"], ["react"])).toEqual([
      "api",
    ]);
  });

  it("keeps at most the suggestion limit", () => {
    const tags = ["a", "b", "c", "d", "e", "f", "g"];
    expect(normalizeTagSuggestions(tags, [])).toHaveLength(AUTO_TAG_LIMITS.suggestions);
  });
});

describe("parseTagSuggestions", () => {
  it("reads the tags from the JSON reply", () => {
    expect(parseTagSuggestions('{"tags":["React","hooks"]}', ["hooks"])).toEqual(["react"]);
  });

  it("returns null for invalid JSON or the wrong shape", () => {
    expect(parseTagSuggestions("not json", [])).toBeNull();
    expect(parseTagSuggestions('["react"]', [])).toBeNull();
    expect(parseTagSuggestions('{"tags":"react"}', [])).toBeNull();
  });
});

describe("AUTO_TAG_RESPONSE_JSON_SCHEMA", () => {
  it("describes an object with a tags array, without the $schema key", () => {
    expect(AUTO_TAG_RESPONSE_JSON_SCHEMA).not.toHaveProperty("$schema");
    expect(AUTO_TAG_RESPONSE_JSON_SCHEMA).toMatchObject({
      type: "object",
      properties: { tags: { type: "array", items: { type: "string" } } },
      required: ["tags"],
    });
  });
});
