import { describe, expect, it } from "vitest";
import { isUploadTypeSlug } from "@/lib/upload-constraints";
import {
  CREATABLE_TYPE_SLUGS,
  createItemSchema,
  isCreatableTypeSlug,
  LANGUAGE_TYPE_SLUGS,
  MARKDOWN_TYPE_SLUGS,
  parseTagInput,
  updateItemSchema,
} from "@/lib/validations/items";

const VALID = { title: "useAuth Hook", tags: [] };

describe("updateItemSchema", () => {
  it("trims the title and rejects an empty one", () => {
    expect(updateItemSchema.parse({ ...VALID, title: "  Hook  " }).title).toBe("Hook");
    const result = updateItemSchema.safeParse({ ...VALID, title: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Title is required");
  });

  it("turns empty optional fields into null and keeps omitted ones undefined", () => {
    const data = updateItemSchema.parse({ ...VALID, description: "  ", language: "" });
    expect(data.description).toBeNull();
    expect(data.language).toBeNull();
    expect(data.content).toBeUndefined();
    expect(data.url).toBeUndefined();
  });

  it("keeps the leading indentation of content", () => {
    const content = "  if (ok) {\n    run();\n  }";
    expect(updateItemSchema.parse({ ...VALID, content }).content).toBe(content);
  });

  it("accepts http(s) URLs and clears an empty one", () => {
    expect(updateItemSchema.parse({ ...VALID, url: " https://example.com " }).url).toBe(
      "https://example.com"
    );
    expect(updateItemSchema.parse({ ...VALID, url: "" }).url).toBeNull();
  });

  it.each(["not a url", "javascript:alert(1)", "ftp://example.com"])(
    "rejects the URL %s",
    (url) => {
      const result = updateItemSchema.safeParse({ ...VALID, url });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Enter a valid http(s) URL");
    }
  );

  it("trims tags, rejects empty ones and drops duplicates", () => {
    expect(updateItemSchema.parse({ ...VALID, tags: [" react ", "hooks", "react"] }).tags).toEqual([
      "react",
      "hooks",
    ]);
    expect(updateItemSchema.safeParse({ ...VALID, tags: ["  "] }).success).toBe(false);
  });
});

describe("createItemSchema", () => {
  it("accepts each creatable type", () => {
    for (const typeSlug of ["snippets", "prompts", "commands", "notes"]) {
      expect(createItemSchema.safeParse({ ...VALID, typeSlug }).success).toBe(true);
    }
  });

  it.each(["unknown", ""])("rejects the type %s", (typeSlug) => {
    const result = createItemSchema.safeParse({ ...VALID, typeSlug });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Choose an item type");
  });

  it.each(["files", "images"])("requires an upload token for %s", (typeSlug) => {
    const result = createItemSchema.safeParse({ ...VALID, typeSlug });
    expect(result.error?.issues[0]).toMatchObject({
      message: "Upload a file",
      path: ["uploadToken"],
    });
    expect(
      createItemSchema.safeParse({ ...VALID, typeSlug, uploadToken: "token" }).success
    ).toBe(true);
  });

  it.each([undefined, "", "   "])("requires a URL for links (%s)", (url) => {
    const result = createItemSchema.safeParse({ ...VALID, typeSlug: "links", url });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ message: "URL is required", path: ["url"] });
  });

  it("accepts a link with a valid URL and rejects an invalid one", () => {
    const link = { ...VALID, typeSlug: "links" };
    expect(createItemSchema.parse({ ...link, url: "https://example.com" }).url).toBe(
      "https://example.com"
    );
    const result = createItemSchema.safeParse({ ...link, url: "nope" });
    expect(result.error?.issues[0].message).toBe("Enter a valid http(s) URL");
  });

  it("applies the shared title and tag rules", () => {
    const data = createItemSchema.parse({
      typeSlug: "notes",
      title: "  Note  ",
      tags: ["a", "a"],
    });
    expect(data).toMatchObject({ typeSlug: "notes", title: "Note", tags: ["a"] });
  });
});

describe("isCreatableTypeSlug", () => {
  it("accepts the types the New Item dialog can create", () => {
    for (const slug of ["snippets", "prompts", "commands", "notes", "links", "files", "images"]) {
      expect(isCreatableTypeSlug(slug)).toBe(true);
    }
  });

  it("rejects unknown slugs", () => {
    for (const slug of ["recipes", "Snippets", ""]) {
      expect(isCreatableTypeSlug(slug)).toBe(false);
    }
  });
});

describe("content editor types", () => {
  // The New Item dialog shows the code editor or the Markdown editor for every text type
  it("puts each creatable text type in exactly one of the code and Markdown sets", () => {
    const textSlugs = CREATABLE_TYPE_SLUGS.filter(
      (slug) => slug !== "links" && !isUploadTypeSlug(slug)
    );
    for (const slug of textSlugs) {
      expect(LANGUAGE_TYPE_SLUGS.has(slug) !== MARKDOWN_TYPE_SLUGS.has(slug)).toBe(true);
    }
  });

  it("uses Markdown for notes and prompts only", () => {
    expect([...MARKDOWN_TYPE_SLUGS].sort()).toEqual(["notes", "prompts"]);
  });
});

describe("parseTagInput", () => {
  it("splits on commas, trims and skips blanks", () => {
    expect(parseTagInput(" react, hooks ,, typescript, ")).toEqual(["react", "hooks", "typescript"]);
  });

  it("returns no tags for an empty input", () => {
    expect(parseTagInput("   ")).toEqual([]);
  });
});
