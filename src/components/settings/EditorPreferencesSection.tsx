"use client";

import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import { SettingRow } from "@/components/settings/SettingRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EDITOR_THEME_LABELS } from "@/lib/monaco-themes";
import {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEMES,
  type EditorTheme,
} from "@/lib/validations/editor-preferences";

interface NumberSelectProps<T extends number> {
  id: string;
  value: T;
  options: readonly T[];
  format: (value: number) => string;
  onChange: (value: T) => void;
}

// Select values are strings, so the chosen one is matched back to its number
function NumberSelect<T extends number>({
  id,
  value,
  options,
  format,
  onChange,
}: NumberSelectProps<T>) {
  function handleChange(next: string | null) {
    const option = options.find((candidate) => String(candidate) === next);
    if (option !== undefined) onChange(option);
  }

  return (
    <Select value={String(value)} onValueChange={handleChange}>
      <SelectTrigger id={id} className="w-36 shrink-0">
        <SelectValue>{(selected: string) => format(Number(selected))}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={String(option)}>
            {format(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Every change is saved straight away by the context; there's no save button
export function EditorPreferencesSection() {
  const { preferences, updatePreference } = useEditorPreferences();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Editor</h2>
        <p className="text-sm text-muted-foreground">
          How the code editor looks and behaves for snippets and commands. Changes save
          automatically.
        </p>
      </div>
      <div className="divide-y rounded-xl border bg-card">
        <SettingRow id="editor-font-size" label="Font size" description="Size of the code text.">
          <NumberSelect
            id="editor-font-size"
            value={preferences.fontSize}
            options={EDITOR_FONT_SIZES}
            format={(size) => `${size}px`}
            onChange={(size) => updatePreference("fontSize", size)}
          />
        </SettingRow>
        <SettingRow
          id="editor-tab-size"
          label="Tab size"
          description="Spaces inserted when you press Tab."
        >
          <NumberSelect
            id="editor-tab-size"
            value={preferences.tabSize}
            options={EDITOR_TAB_SIZES}
            format={(size) => `${size} spaces`}
            onChange={(size) => updatePreference("tabSize", size)}
          />
        </SettingRow>
        <SettingRow id="editor-theme" label="Theme" description="Colors of the code editor.">
          <Select
            value={preferences.theme}
            onValueChange={(next) => next && updatePreference("theme", next)}
          >
            <SelectTrigger id="editor-theme" className="w-36 shrink-0">
              <SelectValue>{(theme: EditorTheme) => EDITOR_THEME_LABELS[theme]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {EDITOR_THEMES.map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {EDITOR_THEME_LABELS[theme]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow
          id="editor-word-wrap"
          label="Word wrap"
          description="Wrap long lines instead of scrolling sideways."
        >
          <Switch
            id="editor-word-wrap"
            checked={preferences.wordWrap}
            onCheckedChange={(checked) => updatePreference("wordWrap", checked)}
          />
        </SettingRow>
        <SettingRow
          id="editor-minimap"
          label="Minimap"
          description="Show a zoomed-out overview of the code beside the editor."
        >
          <Switch
            id="editor-minimap"
            checked={preferences.minimap}
            onCheckedChange={(checked) => updatePreference("minimap", checked)}
          />
        </SettingRow>
      </div>
    </section>
  );
}
