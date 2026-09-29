import { describe, expect, it } from "vitest";
import {
  CODE_EDITOR_MAX_HEIGHT,
  CODE_EDITOR_MIN_EDIT_HEIGHT,
  estimateEditorHeight,
  getEditorHeight,
  toMonacoLanguage,
} from "@/lib/code-editor";

describe("toMonacoLanguage", () => {
  it("maps aliases to Monaco language IDs, ignoring case and spaces", () => {
    expect(toMonacoLanguage("TS")).toBe("typescript");
    expect(toMonacoLanguage(" bash ")).toBe("shell");
    expect(toMonacoLanguage("yml")).toBe("yaml");
  });

  it("passes through languages that are already Monaco IDs", () => {
    expect(toMonacoLanguage("python")).toBe("python");
    expect(toMonacoLanguage("TypeScript")).toBe("typescript");
  });

  it("falls back to plaintext when the language is empty", () => {
    expect(toMonacoLanguage(null)).toBe("plaintext");
    expect(toMonacoLanguage(undefined)).toBe("plaintext");
    expect(toMonacoLanguage("   ")).toBe("plaintext");
  });
});

describe("getEditorHeight", () => {
  it("uses the content height when it fits", () => {
    expect(getEditorHeight(120.4, true)).toBe(121);
  });

  it("caps the height at the max", () => {
    expect(getEditorHeight(2000, true)).toBe(CODE_EDITOR_MAX_HEIGHT);
    expect(getEditorHeight(2000, false)).toBe(CODE_EDITOR_MAX_HEIGHT);
  });

  it("keeps a minimum height only when editing", () => {
    expect(getEditorHeight(44, false)).toBe(CODE_EDITOR_MIN_EDIT_HEIGHT);
    expect(getEditorHeight(44, true)).toBe(44);
  });
});

describe("estimateEditorHeight", () => {
  it("estimates from the line count", () => {
    expect(estimateEditorHeight("a\nb\nc", true)).toBe(84);
  });

  it("uses the given line height for larger fonts", () => {
    expect(estimateEditorHeight("a\nb\nc", true, 27)).toBe(105);
  });

  it("caps long content at the max height", () => {
    expect(estimateEditorHeight("x\n".repeat(100), true)).toBe(CODE_EDITOR_MAX_HEIGHT);
  });
});
