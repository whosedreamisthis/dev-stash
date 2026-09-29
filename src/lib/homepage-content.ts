import {
  AppWindow,
  Bookmark,
  Code,
  File,
  FileText,
  FolderOpen,
  Search,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { GitHubIcon, NotionIcon, SlackIcon, VSCodeIcon } from "@/components/homepage/BrandIcons";

interface NavLink {
  label: string;
  href: string;
}

export const SECTION_LINKS: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  { title: "Product", links: SECTION_LINKS },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/sign-in" },
      { label: "Register", href: "/register" },
    ],
  },
];

// Where the "get started" style buttons lead: the app for signed-in users, sign-up otherwise
export function getStartHref(isSignedIn: boolean) {
  return isSignedIn ? "/dashboard" : "/register";
}

// ── Hero ─────────────────────────────────────

interface ChaosIcon {
  name: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  // Tailwind classes: starting spot (percent of the box) and color for Lucide icons
  className: string;
}

export const CHAOS_ICONS: ChaosIcon[] = [
  { name: "Notion", Icon: NotionIcon, className: "left-[8%] top-[10%]" },
  { name: "GitHub", Icon: GitHubIcon, className: "left-[42%] top-[6%]" },
  { name: "Slack", Icon: SlackIcon, className: "left-[74%] top-[14%]" },
  { name: "VS Code", Icon: VSCodeIcon, className: "left-[20%] top-[42%]" },
  { name: "Browser tabs", Icon: AppWindow, className: "left-[56%] top-[38%] text-indigo-300" },
  { name: "Terminal", Icon: Terminal, className: "left-[76%] top-[60%] text-cyan-400" },
  { name: "Text file", Icon: FileText, className: "left-[10%] top-[72%] text-slate-300" },
  { name: "Bookmark", Icon: Bookmark, className: "left-[44%] top-[74%] text-amber-400" },
];

interface PreviewEntry {
  name: string;
  slug: string;
}

export const PREVIEW_TYPES: PreviewEntry[] = [
  { name: "Snippets", slug: "snippets" },
  { name: "Prompts", slug: "prompts" },
  { name: "Commands", slug: "commands" },
  { name: "Notes", slug: "notes" },
  { name: "Links", slug: "links" },
  { name: "Files", slug: "files" },
  { name: "Images", slug: "images" },
];

export const PREVIEW_ITEMS: PreviewEntry[] = [
  { name: "useDebounce", slug: "snippets" },
  { name: "Code reviewer", slug: "prompts" },
  { name: "git reset", slug: "commands" },
  { name: "Auth notes", slug: "notes" },
  { name: "Next.js docs", slug: "links" },
  { name: "Diagram.png", slug: "images" },
];

// ── Features ─────────────────────────────────

interface Feature {
  title: string;
  description: string;
  slug: string; // item type whose color the card uses
  Icon: LucideIcon;
}

export const FEATURES: Feature[] = [
  {
    title: "Code Snippets",
    description: "Save reusable code with syntax highlighting and a real editor. Copy it back in one click.",
    slug: "snippets",
    Icon: Code,
  },
  {
    title: "AI Prompts",
    description: "Keep your best prompts, system messages and context files instead of digging through old chats.",
    slug: "prompts",
    Icon: Sparkles,
  },
  {
    title: "Instant Search",
    description: "Press ⌘K to search titles, content, tags and types across everything you've stashed.",
    slug: "links",
    Icon: Search,
  },
  {
    title: "Commands",
    description: "That one-off Docker or git incantation you always forget, saved and ready to paste.",
    slug: "commands",
    Icon: Terminal,
  },
  {
    title: "Files & Docs",
    description: "Upload files and images next to the notes that explain them. Preview and download anytime.",
    slug: "files",
    Icon: File,
  },
  {
    title: "Collections",
    description: "Group items of any type into collections like “React Patterns” or “Interview Prep”.",
    slug: "notes",
    Icon: FolderOpen,
  },
];

// ── AI section ───────────────────────────────

export const AI_CAPABILITIES = [
  "Auto-tag suggestions based on content",
  "Short summaries of long notes and files",
  "“Explain This Code” in plain language",
  "Prompt optimizer for clearer AI prompts",
];

export const AI_TAGS = ["react", "hooks", "typescript", "debounce", "performance"];

export type CodeTokenKind = "keyword" | "function" | "string" | "number" | "plain";

// The editor mockup's code, one array of [kind, text] tokens per line
export const AI_CODE_LINES: [CodeTokenKind, string][][] = [
  [["keyword", "import"], ["plain", " { useEffect, useState } "], ["keyword", "from"], ["string", ' "react"'], ["plain", ";"]],
  [],
  [
    ["keyword", "export function"],
    ["function", " useDebounce"],
    ["plain", "<T>(value: T, delay = "],
    ["number", "300"],
    ["plain", ") {"],
  ],
  [["keyword", "  const"], ["plain", " [debounced, setDebounced] = "], ["function", "useState"], ["plain", "(value);"]],
  [["function", "  useEffect"], ["plain", "(() => {"]],
  [
    ["keyword", "    const"],
    ["plain", " id = "],
    ["function", "setTimeout"],
    ["plain", "(() => "],
    ["function", "setDebounced"],
    ["plain", "(value), delay);"],
  ],
  [["keyword", "    return"], ["plain", " () => "], ["function", "clearTimeout"], ["plain", "(id);"]],
  [["plain", "  }, [value, delay]);"]],
  [["keyword", "  return"], ["plain", " debounced;"]],
  [["plain", "}"]],
];

// ── Pricing ──────────────────────────────────

export type BillingPeriod = "monthly" | "yearly";

export const PRO_PRICES: Record<BillingPeriod, { amount: string; period: string; note: string }> = {
  monthly: { amount: "$8", period: "/month", note: "Billed monthly. Cancel anytime." },
  yearly: { amount: "$72", period: "/year", note: "Just $6/month, billed yearly." },
};

interface Plan {
  id: "free" | "pro";
  name: string;
  features: string[];
  cta: string;
}

export const FREE_PLAN_PRICE = { amount: "$0", period: "/forever", note: "Everything you need to get started." };

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    features: ["50 items", "3 collections", "Snippets, prompts, commands, notes & links", "Basic search"],
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    features: [
      "Unlimited items & collections",
      "File & image uploads",
      "AI tags, summaries & code explanations",
      "AI prompt optimizer",
      "Export to JSON / ZIP",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
  },
];
