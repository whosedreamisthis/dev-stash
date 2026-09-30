import { describe, expect, it } from "vitest";
import {
  EMPTY_ITEM_FORM_VALUES,
  getItemFields,
  toItemFormValues,
  toItemPayload,
} from "@/lib/item-fields";

const VALUES = {
  ...EMPTY_ITEM_FORM_VALUES,
  title: "Title",
  description: "Desc",
  content: "code",
  language: "ts",
  url: "https://example.com",
  tags: "a, b",
};

describe("getItemFields", () => {
  it("gives code types content and a language", () => {
    for (const slug of ["snippets", "commands"]) {
      expect(getItemFields(slug)).toEqual({
        content: true,
        language: true,
        url: false,
        upload: false,
      });
    }
  });

  it("gives Markdown types content without a language", () => {
    for (const slug of ["notes", "prompts"]) {
      expect(getItemFields(slug)).toEqual({
        content: true,
        language: false,
        url: false,
        upload: false,
      });
    }
  });

  it("gives links a URL and no content", () => {
    expect(getItemFields("links")).toEqual({
      content: false,
      language: false,
      url: true,
      upload: false,
    });
  });

  it("gives files and images an upload and no content", () => {
    for (const slug of ["files", "images"]) {
      expect(getItemFields(slug)).toEqual({
        content: false,
        language: false,
        url: false,
        upload: true,
      });
    }
  });
});

describe("toItemFormValues", () => {
  it("copies the item's fields and joins its tags", () => {
    expect(
      toItemFormValues({
        title: "Title",
        description: "Desc",
        content: "code",
        language: "ts",
        url: "https://example.com",
        tags: ["a", "b"],
      })
    ).toEqual(VALUES);
  });

  it("turns missing optional fields into empty strings", () => {
    expect(
      toItemFormValues({
        title: "Title",
        description: null,
        content: null,
        language: null,
        url: null,
        tags: [],
      })
    ).toEqual({ ...EMPTY_ITEM_FORM_VALUES, title: "Title" });
  });
});

describe("toItemPayload", () => {
  it("sends content and language for code types", () => {
    expect(toItemPayload(VALUES, getItemFields("snippets"))).toEqual({
      title: "Title",
      description: "Desc",
      tags: ["a", "b"],
      content: "code",
      language: "ts",
    });
  });

  it("sends only the URL for links", () => {
    expect(toItemPayload(VALUES, getItemFields("links"))).toEqual({
      title: "Title",
      description: "Desc",
      tags: ["a", "b"],
      url: "https://example.com",
    });
  });

  it("sends only the shared fields for uploads", () => {
    expect(toItemPayload(VALUES, getItemFields("images"))).toEqual({
      title: "Title",
      description: "Desc",
      tags: ["a", "b"],
    });
  });
});
