import { describe, expect, it } from "vitest";
import {
  DEFAULT_EDITOR_PREFERENCES,
  getEditorLineHeight,
  parseEditorPreferences,
} from "@/lib/editor-preferences";

describe("parseEditorPreferences", () => {
  it("returns the defaults when nothing is stored", () => {
    expect(parseEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences(undefined)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences("vs-dark")).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("keeps every valid stored value", () => {
    const stored = { fontSize: 18, tabSize: 4, wordWrap: false, minimap: true, theme: "github-dark" };
    expect(parseEditorPreferences(stored)).toEqual(stored);
  });

  it("fills missing fields with defaults", () => {
    expect(parseEditorPreferences({ minimap: true })).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      minimap: true,
    });
  });

  it("replaces only the invalid fields and drops unknown ones", () => {
    expect(
      parseEditorPreferences({ fontSize: 15, tabSize: "4", theme: "solarized", wordWrap: false, extra: 1 })
    ).toEqual({ ...DEFAULT_EDITOR_PREFERENCES, wordWrap: false });
  });
});

describe("getEditorLineHeight", () => {
  it("scales with the font size and keeps 13px at 20px lines", () => {
    expect(getEditorLineHeight(13)).toBe(20);
    expect(getEditorLineHeight(12)).toBe(18);
    expect(getEditorLineHeight(18)).toBe(27);
  });
});
