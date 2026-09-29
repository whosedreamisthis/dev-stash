import { describe, expect, it } from "vitest";
import {
  buildDescriptionPrompt,
  cleanDescription,
  DESCRIPTION_LIMITS,
  type DescriptionPromptInput,
} from "@/lib/ai-description";
import { ITEM_LIMITS } from "@/lib/validations/items";

const EMPTY: DescriptionPromptInput = {
  title: "",
  typeSlug: "snippets",
  content: null,
  language: null,
  url: null,
  fileName: null,
  fileMimeType: null,
  tags: [],
};

describe("buildDescriptionPrompt", () => {
  it("wraps the filled fields in delimiters and leaves out empty ones", () => {
    expect(
      buildDescriptionPrompt({
        ...EMPTY,
        title: "useDebounce",
        language: "typescript",
        content: "const a = 1;",
        tags: ["react", "hooks"],
      })
    ).toBe(
      "<item_type>snippets</item_type>\n<title>useDebounce</title>\n<language>typescript</language>\n<tags>react, hooks</tags>\n<content>const a = 1;</content>"
    );
  });

  it("sends a link's URL and a file's name and type", () => {
    expect(buildDescriptionPrompt({ ...EMPTY, typeSlug: "links", url: "https://react.dev" })).toBe(
      "<item_type>links</item_type>\n<url>https://react.dev</url>"
    );
    expect(
      buildDescriptionPrompt({
        ...EMPTY,
        typeSlug: "files",
        fileName: "report.pdf",
        fileMimeType: "application/pdf",
      })
    ).toBe(
      "<item_type>files</item_type>\n<file_name>report.pdf</file_name>\n<file_type>application/pdf</file_type>"
    );
  });

  it("truncates long content", () => {
    const content = "x".repeat(DESCRIPTION_LIMITS.content + 500);
    expect(buildDescriptionPrompt({ ...EMPTY, content })).toContain(
      `<content>${"x".repeat(DESCRIPTION_LIMITS.content)}</content>`
    );
  });
});

describe("cleanDescription", () => {
  it("collapses whitespace and strips wrapping quotes", () => {
    expect(cleanDescription('  "Debounces a value.\n\nHandy for search."  ')).toBe(
      "Debounces a value. Handy for search."
    );
  });

  it("returns null for an empty reply", () => {
    expect(cleanDescription("  \n ")).toBeNull();
    expect(cleanDescription('""')).toBeNull();
  });

  it("keeps the reply within the description limit", () => {
    expect(cleanDescription("a".repeat(ITEM_LIMITS.description + 10))).toHaveLength(
      ITEM_LIMITS.description
    );
  });
});
