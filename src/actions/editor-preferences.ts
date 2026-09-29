"use server";

import { updateEditorPreferences as updateEditorPreferencesQuery } from "@/lib/db/users";
import { getSessionUserId, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import {
  editorPreferencesSchema,
  type EditorPreferences,
} from "@/lib/validations/editor-preferences";

export interface UpdateEditorPreferencesResult {
  success: boolean;
  data?: EditorPreferences;
  error?: string;
}

// Saves the full set of preferences; the settings form sends it on every change
export async function updateEditorPreferences(
  preferences: EditorPreferences
): Promise<UpdateEditorPreferencesResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = editorPreferencesSchema.safeParse(preferences);
  if (!parsed.success) return { success: false, error: "Those editor settings aren't valid." };

  try {
    const saved = await updateEditorPreferencesQuery(userId, parsed.data);
    if (!saved) return { success: false, error: NOT_SIGNED_IN_ERROR };
    return { success: true, data: parsed.data };
  } catch (error) {
    console.error("Saving editor preferences failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
