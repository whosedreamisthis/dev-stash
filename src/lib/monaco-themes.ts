import type { editor } from "monaco-editor";
import type { EditorTheme } from "@/lib/validations/editor-preferences";

type ThemeData = editor.IStandaloneThemeData;

// Scrollbars and line highlights shared by every theme
const CHROME_COLORS = {
  "editor.lineHighlightBorder": "#00000000",
  "scrollbar.shadow": "#00000000",
  "scrollbarSlider.background": "#ffffff1a",
  "scrollbarSlider.hoverBackground": "#ffffff2e",
  "scrollbarSlider.activeBackground": "#ffffff40",
};

// "vs-dark" keeps the look the editor had before themes were configurable:
// vs-dark recoloured to the app's neutral palette
const DEVSTASH_DARK: ThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    ...CHROME_COLORS,
    "editor.background": "#171717",
    "editorGutter.background": "#171717",
    "editorLineNumber.foreground": "#525252",
    "editorLineNumber.activeForeground": "#a3a3a3",
    "editor.lineHighlightBackground": "#ffffff08",
  },
};

const MONOKAI: ThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "", foreground: "F8F8F2" },
    { token: "comment", foreground: "75715E", fontStyle: "italic" },
    { token: "string", foreground: "E6DB74" },
    { token: "number", foreground: "AE81FF" },
    { token: "constant", foreground: "AE81FF" },
    { token: "keyword", foreground: "F92672" },
    { token: "operator", foreground: "F92672" },
    { token: "type", foreground: "66D9EF", fontStyle: "italic" },
    { token: "type.identifier", foreground: "A6E22E" },
    { token: "tag", foreground: "F92672" },
    { token: "attribute.name", foreground: "A6E22E" },
    { token: "attribute.value", foreground: "E6DB74" },
    { token: "regexp", foreground: "E6DB74" },
  ],
  colors: {
    ...CHROME_COLORS,
    "editor.background": "#272822",
    "editor.foreground": "#F8F8F2",
    "editorGutter.background": "#272822",
    "editorLineNumber.foreground": "#90908A",
    "editorLineNumber.activeForeground": "#F8F8F2",
    "editor.lineHighlightBackground": "#3E3D32",
    "editor.selectionBackground": "#49483E",
    "editorCursor.foreground": "#F8F8F0",
  },
};

const GITHUB_DARK: ThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "", foreground: "E6EDF3" },
    { token: "comment", foreground: "8B949E", fontStyle: "italic" },
    { token: "string", foreground: "A5D6FF" },
    { token: "number", foreground: "79C0FF" },
    { token: "constant", foreground: "79C0FF" },
    { token: "keyword", foreground: "FF7B72" },
    { token: "operator", foreground: "FF7B72" },
    { token: "type", foreground: "FFA657" },
    { token: "type.identifier", foreground: "FFA657" },
    { token: "tag", foreground: "7EE787" },
    { token: "attribute.name", foreground: "79C0FF" },
    { token: "attribute.value", foreground: "A5D6FF" },
    { token: "regexp", foreground: "7EE787" },
  ],
  colors: {
    ...CHROME_COLORS,
    "editor.background": "#0D1117",
    "editor.foreground": "#E6EDF3",
    "editorGutter.background": "#0D1117",
    "editorLineNumber.foreground": "#6E7681",
    "editorLineNumber.activeForeground": "#E6EDF3",
    "editor.lineHighlightBackground": "#6E76811A",
    "editor.selectionBackground": "#264F78",
    "editorCursor.foreground": "#E6EDF3",
  },
};

// Monaco's own "vs-dark" can't be redefined, so each option gets its own name
const THEMES: Record<EditorTheme, { name: string; data: ThemeData }> = {
  "vs-dark": { name: "devstash-dark", data: DEVSTASH_DARK },
  monokai: { name: "devstash-monokai", data: MONOKAI },
  "github-dark": { name: "devstash-github-dark", data: GITHUB_DARK },
};

export const EDITOR_THEME_LABELS: Record<EditorTheme, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

export function getMonacoThemeName(theme: EditorTheme): string {
  return THEMES[theme].name;
}

export function defineEditorThemes(monacoEditor: {
  defineTheme: (name: string, data: ThemeData) => void;
}) {
  for (const { name, data } of Object.values(THEMES)) {
    monacoEditor.defineTheme(name, data);
  }
}
