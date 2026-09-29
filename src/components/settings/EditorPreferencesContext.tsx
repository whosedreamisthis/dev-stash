"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { updateEditorPreferences } from "@/actions/editor-preferences";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";
import type { EditorPreferences } from "@/lib/validations/editor-preferences";

const SAVE_ERROR = "Couldn't save your editor settings. Please try again.";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  updatePreference: <K extends keyof EditorPreferences>(
    key: K,
    value: EditorPreferences[K],
  ) => void;
}

// Outside the provider, editors use the defaults and nothing can be saved
const EditorPreferencesContext = createContext<EditorPreferencesContextValue>({
  preferences: DEFAULT_EDITOR_PREFERENCES,
  updatePreference: () => {},
});

interface EditorPreferencesProviderProps {
  initialPreferences: EditorPreferences;
  children: React.ReactNode;
}

export function EditorPreferencesProvider({
  initialPreferences,
  children,
}: EditorPreferencesProviderProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const saved = useRef(initialPreferences);

  // Applied straight away so open editors update as the setting changes, then
  // saved; a failed save puts back the last saved preferences
  const updatePreference = useCallback<EditorPreferencesContextValue["updatePreference"]>(
    (key, value) => {
      const next = { ...preferences, [key]: value };
      setPreferences(next);

      const revert = (message: string) => {
        setPreferences(saved.current);
        toast.error(message);
      };

      updateEditorPreferences(next)
        .then((result) => {
          if (!result.data) return revert(result.error ?? SAVE_ERROR);
          saved.current = result.data;
          toast.success("Editor settings saved");
        })
        // The action call itself failed, e.g. the network dropped
        .catch(() => revert(SAVE_ERROR));
    },
    [preferences],
  );

  const value = useMemo(() => ({ preferences, updatePreference }), [preferences, updatePreference]);

  return (
    <EditorPreferencesContext.Provider value={value}>{children}</EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences() {
  return useContext(EditorPreferencesContext);
}
