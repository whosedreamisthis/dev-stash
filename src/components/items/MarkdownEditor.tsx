"use client";

import { useId, useState } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { EditorWindowHeader } from "@/components/items/EditorWindowHeader";
import { cn } from "@/lib/utils";

type Tab = "write" | "preview";

const TAB_LABELS: Record<Tab, string> = { write: "Write", preview: "Preview" };

// Links open in a new tab; unsafe protocols are already stripped by react-markdown
const MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

interface MarkdownEditorProps {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  // Passed to the textarea so a field label focuses it
  id?: string;
  ariaLabel?: string;
  invalid?: boolean;
  "aria-describedby"?: string;
  className?: string;
}

export function MarkdownEditor({
  value,
  readOnly = false,
  onChange,
  id,
  ariaLabel = "Markdown editor",
  invalid,
  "aria-describedby": describedBy,
  className,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<Tab>(readOnly ? "preview" : "write");
  const tabIdPrefix = useId();
  const tabs: Tab[] = readOnly ? ["preview"] : ["write", "preview"];
  const activeTab = readOnly ? "preview" : tab;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900",
        invalid && "border-destructive",
        className,
      )}
    >
      <EditorWindowHeader value={value}>
        <div role="tablist" aria-label={ariaLabel} className="flex items-center gap-1">
          {tabs.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              id={`${tabIdPrefix}-${name}-tab`}
              aria-selected={activeTab === name}
              aria-controls={`${tabIdPrefix}-panel`}
              onClick={() => setTab(name)}
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                activeTab === name
                  ? "bg-neutral-800 text-neutral-100"
                  : "text-neutral-400 hover:text-neutral-100",
              )}
            >
              {TAB_LABELS[name]}
            </button>
          ))}
        </div>
      </EditorWindowHeader>

      <div
        role="tabpanel"
        id={`${tabIdPrefix}-panel`}
        aria-labelledby={`${tabIdPrefix}-${activeTab}-tab`}
      >
        {activeTab === "write" ? (
          <textarea
            id={id}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            placeholder="Write in Markdown…"
            spellCheck
            className="editor-scrollbar block field-sizing-content max-h-100 min-h-40 w-full resize-none overflow-y-auto bg-transparent p-3 font-mono text-sm leading-relaxed text-neutral-100 outline-none placeholder:text-neutral-500"
          />
        ) : (
          <div
            className={cn(
              "editor-scrollbar max-h-100 overflow-y-auto p-4",
              !readOnly && "min-h-40",
            )}
          >
            {value.trim() ? (
              <div className="markdown-preview">
                <Markdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                  {value}
                </Markdown>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Nothing to preview</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
