"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  // Names what's copied for screen readers, e.g. "Copy useAuth Hook"
  label: string;
  className?: string;
}

// Icon button that copies text, showing a check and a toast when it works
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  function handleCopy(event: React.MouseEvent) {
    // Keeps the click from reaching the card it sits on
    event.stopPropagation();
    void copy(value);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={handleCopy}
      aria-label={label}
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}
