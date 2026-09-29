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

export interface CodeLanguage {
  id: string;
  label: string;
}

// Languages offered in the item forms' dropdown, by Monaco language ID
export const CODE_LANGUAGES: readonly CodeLanguage[] = [
  { id: "plaintext", label: "Plain text" },
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
  { id: "csharp", label: "C#" },
  { id: "css", label: "CSS" },
  { id: "dart", label: "Dart" },
  { id: "dockerfile", label: "Dockerfile" },
  { id: "go", label: "Go" },
  { id: "graphql", label: "GraphQL" },
  { id: "html", label: "HTML" },
  { id: "java", label: "Java" },
  { id: "javascript", label: "JavaScript" },
  { id: "json", label: "JSON" },
  { id: "kotlin", label: "Kotlin" },
  { id: "lua", label: "Lua" },
  { id: "markdown", label: "Markdown" },
  { id: "php", label: "PHP" },
  { id: "powershell", label: "PowerShell" },
  { id: "python", label: "Python" },
  { id: "r", label: "R" },
  { id: "ruby", label: "Ruby" },
  { id: "rust", label: "Rust" },
  { id: "scss", label: "SCSS" },
  { id: "shell", label: "Shell / Bash" },
  { id: "sql", label: "SQL" },
  { id: "swift", label: "Swift" },
  { id: "typescript", label: "TypeScript" },
  { id: "xml", label: "XML" },
  { id: "yaml", label: "YAML" },
];

// Display name for a language or alias (e.g. "ts" → "TypeScript"); unknown ones show as typed
export function getCodeLanguageLabel(language: string): string {
  const id = toMonacoLanguage(language);
  return CODE_LANGUAGES.find((option) => option.id === id)?.label ?? language;
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
