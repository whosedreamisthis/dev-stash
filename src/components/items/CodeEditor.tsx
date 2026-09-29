"use client";

import { useState } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { EditorWindowHeader } from "@/components/items/EditorWindowHeader";
import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import {
  CODE_EDITOR_PADDING,
  estimateEditorHeight,
  getEditorHeight,
  toMonacoLanguage,
} from "@/lib/code-editor";
import { getEditorLineHeight } from "@/lib/editor-preferences";
import { defineEditorThemes, getMonacoThemeName } from "@/lib/monaco-themes";
import { cn } from "@/lib/utils";

const handleBeforeMount: BeforeMount = (monaco) => {
  // Snippets are standalone, so imports like "react" can never resolve; only
  // syntax errors are shown, as Monaco already does for JavaScript
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });

  defineEditorThemes(monaco.editor);
};

interface CodeEditorProps {
  value: string;
  language?: string | null;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  invalid?: boolean;
  className?: string;
}

export function CodeEditor({
  value,
  language,
  readOnly = false,
  onChange,
  ariaLabel = "Code editor",
  invalid,
  className,
}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
  const lineHeight = getEditorLineHeight(preferences.fontSize);
  const [height, setHeight] = useState(() =>
    estimateEditorHeight(value, readOnly, lineHeight),
  );

  // Grows with the content up to the max height, then scrolls
  const handleMount: OnMount = (editor) => {
    const updateHeight = () => setHeight(getEditorHeight(editor.getContentHeight(), readOnly));
    editor.onDidContentSizeChange(updateHeight);
    updateHeight();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900",
        invalid && "border-destructive",
        className,
      )}
    >
      <EditorWindowHeader value={value} label={language} />
      <Editor
        height={height}
        value={value}
        language={toMonacoLanguage(language)}
        theme={getMonacoThemeName(preferences.theme)}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={(next) => onChange?.(next ?? "")}
        loading={<div className="size-full bg-neutral-900" />}
        options={{
          readOnly,
          domReadOnly: readOnly,
          ariaLabel,
          fontSize: preferences.fontSize,
          lineHeight,
          padding: { top: CODE_EDITOR_PADDING, bottom: CODE_EDITOR_PADDING },
          tabSize: preferences.tabSize,
          // Otherwise Monaco guesses the tab size from the content and ignores the setting
          detectIndentation: false,
          wordWrap: preferences.wordWrap ? "on" : "off",
          minimap: { enabled: preferences.minimap },
          lineNumbersMinChars: 3,
          folding: false,
          glyphMargin: false,
          scrollBeyondLastLine: false,
          renderLineHighlight: readOnly ? "none" : "line",
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          fixedOverflowWidgets: true,
          automaticLayout: true,
          contextmenu: !readOnly,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false,
            // Lets the page scroll when the editor has nothing left to scroll
            alwaysConsumeMouseWheel: false,
          },
        }}
      />
    </div>
  );
}
