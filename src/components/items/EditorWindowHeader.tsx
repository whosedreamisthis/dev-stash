"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";

const WINDOW_DOTS = ["bg-[#ff5f57]", "bg-[#febc2e]", "bg-[#28c840]"];

interface EditorWindowHeaderProps {
  // Text the copy button copies
  value: string;
  // Shown next to the copy button, e.g. the language
  label?: string | null;
  // Shown after the window dots, e.g. tabs
  children?: React.ReactNode;
}

// macOS-style window bar shared by the code and Markdown editors
export function EditorWindowHeader({ value, label, children }: EditorWindowHeaderProps) {
  const { copied, copy } = useCopyToClipboard();
  const trimmedLabel = label?.trim();

  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950/60 py-1.5 pr-1.5 pl-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          {WINDOW_DOTS.map((color) => (
            <span key={color} className={cn("size-3 rounded-full", color)} />
          ))}
        </div>
        {children}
      </div>
      <div className="flex min-w-0 items-center gap-1">
        {trimmedLabel && (
          <span className="truncate font-mono text-xs text-neutral-400">{trimmedLabel}</span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => copy(value)}
          disabled={!value}
          aria-label="Copy content"
          className="text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}
