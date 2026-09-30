"use client";

import { useState } from "react";
import { toast } from "sonner";

const COPIED_RESET_MS = 2000;

// Copies text with a toast; `copied` stays true briefly so buttons can show a check
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  }

  return { copied, copy };
}
