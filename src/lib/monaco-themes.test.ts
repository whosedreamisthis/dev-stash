import { describe, expect, it, vi } from "vitest";
import { defineEditorThemes, getMonacoThemeName } from "@/lib/monaco-themes";
import { EDITOR_THEMES } from "@/lib/validations/editor-preferences";

describe("defineEditorThemes", () => {
  it("defines a Monaco theme for every theme option", () => {
    const defineTheme = vi.fn();
    defineEditorThemes({ defineTheme });

    const defined = defineTheme.mock.calls.map(([name]) => name);
    expect(defined).toEqual(EDITOR_THEMES.map(getMonacoThemeName));
  });

  it("keeps the app's original editor look for vs-dark", () => {
    expect(getMonacoThemeName("vs-dark")).toBe("devstash-dark");
  });
});
