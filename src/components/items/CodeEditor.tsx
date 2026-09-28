"use client";

import { useState } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CODE_EDITOR_LINE_HEIGHT,
  CODE_EDITOR_PADDING,
  estimateEditorHeight,
  getEditorHeight,
  toMonacoLanguage,
} from "@/lib/code-editor";
import { cn } from "@/lib/utils";

const THEME_NAME = "devstash-dark";

// Dark theme matching the app's neutral palette, including the scrollbar
const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(THEME_NAME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#171717",
      "editorGutter.background": "#171717",
      "editorLineNumber.foreground": "#525252",
      "editorLineNumber.activeForeground": "#a3a3a3",
      "editor.lineHighlightBackground": "#ffffff08",
      "editor.lineHighlightBorder": "#00000000",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff1a",
      "scrollbarSlider.hoverBackground": "#ffffff2e",
      "scrollbarSlider.activeBackground": "#ffffff40",
    },
  });
};

const WINDOW_DOTS = ["bg-[#ff5f57]", "bg-[#febc2e]", "bg-[#28c840]"];

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
  const [height, setHeight] = useState(() => estimateEditorHeight(value, readOnly));
  const [copied, setCopied] = useState(false);
  const label = language?.trim();

  // Grows with the content up to the max height, then scrolls
  const handleMount: OnMount = (editor) => {
    const updateHeight = () => setHeight(getEditorHeight(editor.getContentHeight(), readOnly));
    editor.onDidContentSizeChange(updateHeight);
    updateHeight();
  };

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900",
        invalid && "border-destructive",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950/60 py-1.5 pr-1.5 pl-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {WINDOW_DOTS.map((color) => (
            <span key={color} className={cn("size-3 rounded-full", color)} />
          ))}
        </div>
        <div className="flex min-w-0 items-center gap-1">
          {label && (
            <span className="truncate font-mono text-xs text-neutral-400">{label}</span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            disabled={!value}
            aria-label="Copy code"
            className="text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      </div>
      <Editor
        height={height}
        value={value}
        language={toMonacoLanguage(language)}
        theme={THEME_NAME}
        beforeMount={defineTheme}
        onMount={handleMount}
        onChange={(next) => onChange?.(next ?? "")}
        loading={<div className="size-full bg-neutral-900" />}
        options={{
          readOnly,
          domReadOnly: readOnly,
          ariaLabel,
          fontSize: 13,
          lineHeight: CODE_EDITOR_LINE_HEIGHT,
          padding: { top: CODE_EDITOR_PADDING, bottom: CODE_EDITOR_PADDING },
          tabSize: 2,
          minimap: { enabled: false },
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
