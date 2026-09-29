import {
  editorPreferencesSchema,
  type EditorPreferences,
} from "@/lib/validations/editor-preferences";

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

// Reads the stored JSON. Missing or invalid fields (e.g. an option that was
// removed) fall back to their defaults instead of discarding the rest.
export function parseEditorPreferences(value: unknown): EditorPreferences {
  if (typeof value !== "object" || value === null) return DEFAULT_EDITOR_PREFERENCES;

  const stored = value as Record<string, unknown>;
  const shape = editorPreferencesSchema.shape;
  const preferences = { ...DEFAULT_EDITOR_PREFERENCES };

  for (const key of Object.keys(shape) as (keyof EditorPreferences)[]) {
    const parsed = shape[key].safeParse(stored[key]);
    if (parsed.success) Object.assign(preferences, { [key]: parsed.data });
  }
  return preferences;
}

// 1.5x the font size keeps the default 13px at the editor's original 20px lines
export function getEditorLineHeight(fontSize: number): number {
  return Math.round(fontSize * 1.5);
}
