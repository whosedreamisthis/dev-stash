export const CODE_EDITOR_MAX_HEIGHT = 400;
export const CODE_EDITOR_MIN_EDIT_HEIGHT = 160;
export const CODE_EDITOR_LINE_HEIGHT = 20;
export const CODE_EDITOR_PADDING = 12;

// Common short names and aliases mapped to Monaco language IDs
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  golang: "go",
  cs: "csharp",
  "c#": "csharp",
  "c++": "cpp",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  console: "shell",
  terminal: "shell",
  ps: "powershell",
  ps1: "powershell",
  pwsh: "powershell",
  yml: "yaml",
  md: "markdown",
  htm: "html",
  dockerfile: "dockerfile",
  docker: "dockerfile",
  postgres: "sql",
  postgresql: "sql",
  plsql: "sql",
  text: "plaintext",
  txt: "plaintext",
};

// Turns a free-text language (e.g. "TS", "bash") into a Monaco language ID
export function toMonacoLanguage(language: string | null | undefined): string {
  const normalized = language?.trim().toLowerCase();
  if (!normalized) return "plaintext";
  return LANGUAGE_ALIASES[normalized] ?? normalized;
}

// Height of the content, never above the max and, when editing, never below the min
export function getEditorHeight(contentHeight: number, readOnly: boolean): number {
  const min = readOnly ? 0 : CODE_EDITOR_MIN_EDIT_HEIGHT;
  return Math.min(CODE_EDITOR_MAX_HEIGHT, Math.max(min, Math.ceil(contentHeight)));
}

// Height guess from the line count, used before Monaco has measured the content
export function estimateEditorHeight(
  value: string,
  readOnly: boolean,
  lineHeight = CODE_EDITOR_LINE_HEIGHT,
): number {
  const lines = value.split("\n").length;
  return getEditorHeight(lines * lineHeight + CODE_EDITOR_PADDING * 2, readOnly);
}
