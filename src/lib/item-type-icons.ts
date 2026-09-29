import {
  Code,
  File,
  Image,
  Link,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

export const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link,
};

// Keyed by slug so the icon is known from the URL alone, before any data loads
export const ITEM_TYPE_SLUG_ICONS: Record<string, LucideIcon> = {
  snippets: Code,
  prompts: Sparkles,
  commands: Terminal,
  notes: StickyNote,
  files: File,
  images: Image,
  links: Link,
};

// Static class names so Tailwind can detect the type colors at build time
export const ITEM_TYPE_TEXT_COLORS: Record<string, string> = {
  snippets: "text-[#3b82f6]",
  prompts: "text-[#8b5cf6]",
  commands: "text-[#f97316]",
  notes: "text-[#fde047]",
  files: "text-[#6b7280]",
  images: "text-[#ec4899]",
  links: "text-[#10b981]",
};

export const ITEM_TYPE_BG_COLORS: Record<string, string> = {
  snippets: "bg-[#3b82f6]",
  prompts: "bg-[#8b5cf6]",
  commands: "bg-[#f97316]",
  notes: "bg-[#fde047]",
  files: "bg-[#6b7280]",
  images: "bg-[#ec4899]",
  links: "bg-[#10b981]",
};

// Card borders: a thick colored top edge, and the whole thin border takes the color on hover
export const ITEM_TYPE_BORDER_COLORS: Record<string, string> = {
  snippets: "border-t-3 border-t-[#3b82f6] hover:border-[#3b82f6]",
  prompts: "border-t-3 border-t-[#8b5cf6] hover:border-[#8b5cf6]",
  commands: "border-t-3 border-t-[#f97316] hover:border-[#f97316]",
  notes: "border-t-3 border-t-[#fde047] hover:border-[#fde047]",
  files: "border-t-3 border-t-[#6b7280] hover:border-[#6b7280]",
  images: "border-t-3 border-t-[#ec4899] hover:border-[#ec4899]",
  links: "border-t-3 border-t-[#10b981] hover:border-[#10b981]",
};
