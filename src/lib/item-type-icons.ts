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

export const ITEM_TYPE_BORDER_COLORS: Record<string, string> = {
  snippets: "border-l-[#3b82f6]",
  prompts: "border-l-[#8b5cf6]",
  commands: "border-l-[#f97316]",
  notes: "border-l-[#fde047]",
  files: "border-l-[#6b7280]",
  images: "border-l-[#ec4899]",
  links: "border-l-[#10b981]",
};
