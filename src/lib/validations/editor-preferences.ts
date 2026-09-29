import { z } from "zod";

export const EDITOR_FONT_SIZES = [12, 13, 14, 16, 18] as const;
export const EDITOR_TAB_SIZES = [2, 4, 8] as const;
export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;

function oneOf<T extends number>(values: readonly T[]) {
  return z
    .number()
    .refine((value): value is T => values.includes(value as T), "Choose one of the options");
}

export const editorPreferencesSchema = z.object({
  fontSize: oneOf(EDITOR_FONT_SIZES),
  tabSize: oneOf(EDITOR_TAB_SIZES),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES),
});

export type EditorPreferences = z.infer<typeof editorPreferencesSchema>;
export type EditorTheme = EditorPreferences["theme"];
