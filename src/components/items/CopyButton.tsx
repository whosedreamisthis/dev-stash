"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  // Names what's copied for screen readers, e.g. "Copy useAuth Hook"
  label: string;
  className?: string;
}

// Icon button that copies text, showing a check and a toast when it works
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(event: React.MouseEvent) {
    // Keeps the click from reaching the card it sits on
    event.stopPropagation();
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
