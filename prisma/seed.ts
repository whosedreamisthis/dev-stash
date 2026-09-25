import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type TypeSlug = (typeof SYSTEM_TYPES)[number]["slug"];

interface SeedItem {
  type: TypeSlug;
  title: string;
  description: string;
  content?: string;
  language?: string;
  url?: string;
  isPinned?: boolean;
  isFavorite?: boolean;
}

interface SeedCollection {
  name: string;
  description: string;
  defaultType: TypeSlug;
  isFavorite?: boolean;
  items: SeedItem[];
}

const DEMO_USER = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
};

const SYSTEM_TYPES = [
  { name: "Snippet", slug: "snippets", icon: "Code", color: "#3b82f6", contentType: "TEXT", isProOnly: false },
  { name: "Prompt", slug: "prompts", icon: "Sparkles", color: "#8b5cf6", contentType: "TEXT", isProOnly: false },
  { name: "Command", slug: "commands", icon: "Terminal", color: "#f97316", contentType: "TEXT", isProOnly: false },
  { name: "Note", slug: "notes", icon: "StickyNote", color: "#fde047", contentType: "TEXT", isProOnly: false },
  { name: "File", slug: "files", icon: "File", color: "#6b7280", contentType: "FILE", isProOnly: true },
  { name: "Image", slug: "images", icon: "Image", color: "#ec4899", contentType: "FILE", isProOnly: true },
  { name: "Link", slug: "links", icon: "Link", color: "#10b981", contentType: "URL", isProOnly: false },
] as const;

const COLLECTIONS: SeedCollection[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    defaultType: "snippets",
    isFavorite: true,
    items: [
      {
        type: "snippets",
        title: "useDebounce & useLocalStorage hooks",
        description: "Debounce a changing value and persist state to localStorage",
        language: "typescript",
        isPinned: true,
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}`,
      },
      {
        type: "snippets",
        title: "Context provider & compound components",
        description: "Typed context provider with a compound Tabs component",
        language: "typescript",
        isFavorite: true,
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

interface TabsContextValue {
  active: string;
  setActive: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used inside <Tabs>");
  return context;
}

export function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [active, setActive] = useState(defaultTab);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

Tabs.Trigger = function TabsTrigger({ id, children }: { id: string; children: ReactNode }) {
  const { active, setActive } = useTabs();
  return (
    <button aria-selected={active === id} onClick={() => setActive(id)}>
      {children}
    </button>
  );
};

Tabs.Panel = function TabsPanel({ id, children }: { id: string; children: ReactNode }) {
  const { active } = useTabs();
  return active === id ? <div>{children}</div> : null;
};`,
      },
      {
        type: "snippets",
        title: "Utility functions",
        description: "Small helpers for class names, formatting and async delays",
        language: "typescript",
        content: `export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return \`\${(bytes / 1024 ** i).toFixed(decimals)} \${units[i]}\`;
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function groupBy<T, K extends PropertyKey>(list: T[], getKey: (item: T) => K) {
  return list.reduce(
    (groups, item) => {
      (groups[getKey(item)] ??= []).push(item);
      return groups;
    },
    {} as Record<K, T[]>
  );
}`,
      },
    ],
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    defaultType: "prompts",
    isFavorite: true,
    items: [
      {
        type: "prompts",
        title: "Code review",
        description: "Focused review of a diff, grouped by severity",
        isPinned: true,
        isFavorite: true,
        content: `You are a senior engineer reviewing a pull request.

Review the diff below for:
1. Bugs and logic errors (including edge cases)
2. Security issues (auth checks, input validation, secrets)
3. Performance problems (N+1 queries, unnecessary re-renders)
4. Readability and consistency with the surrounding code

List findings grouped by severity (critical, major, minor). For each one, quote the relevant line, explain the problem and suggest a concrete fix. Skip style nitpicks a linter would catch.

Diff:
{{diff}}`,
      },
      {
        type: "prompts",
        title: "Documentation generation",
        description: "Generate README-style docs for a module",
        content: `Write documentation for the following module for developers who are new to the codebase.

Include:
- A one-paragraph overview of what the module does and when to use it
- Installation or setup steps, if any
- Each exported function or component with its parameters, return value and a short usage example
- Common pitfalls or gotchas

Use Markdown with clear headings. Keep examples short and runnable.

Code:
{{code}}`,
      },
      {
        type: "prompts",
        title: "Refactoring assistance",
        description: "Refactor code without changing its behavior",
        content: `Refactor the code below to improve readability and maintainability without changing its behavior.

Constraints:
- Keep the public API (exported names and signatures) the same
- Prefer small, well-named functions over comments
- Remove duplication and dead code
- Do not add new dependencies

First list the refactorings you plan to make and why, then show the full refactored code, then list anything that should be covered by tests to confirm the behavior is unchanged.

Code:
{{code}}`,
      },
    ],
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    defaultType: "snippets",
    items: [
      {
        type: "snippets",
        title: "Next.js Dockerfile & GitHub Actions CI",
        description: "Multi-stage Docker build plus a CI workflow that lints and builds",
        language: "dockerfile",
        content: `# Dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]

# .github/workflows/ci.yml
# name: CI
# on: [push, pull_request]
# jobs:
#   build:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - uses: actions/setup-node@v4
#         with: { node-version: 22, cache: npm }
#       - run: npm ci
#       - run: npm run lint
#       - run: npm run build`,
      },
      {
        type: "commands",
        title: "Deploy with migrations",
        description: "Apply production migrations, build and restart the app",
        language: "bash",
        content: `npm ci && npx prisma migrate deploy && npm run build && pm2 restart devstash`,
      },
      {
        type: "links",
        title: "Docker Docs",
        description: "Official Docker documentation",
        url: "https://docs.docker.com",
      },
      {
        type: "links",
        title: "GitHub Actions Docs",
        description: "Workflows, runners and CI/CD with GitHub Actions",
        url: "https://docs.github.com/en/actions",
      },
    ],
  },
  {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    defaultType: "commands",
    items: [
      {
        type: "commands",
        title: "Undo last commit (keep changes)",
        description: "Move HEAD back one commit and keep the changes staged",
        language: "bash",
        content: "git reset --soft HEAD~1",
        isFavorite: true,
      },
      {
        type: "commands",
        title: "Clean up Docker",
        description: "Remove stopped containers, unused images, networks and build cache",
        language: "bash",
        content: "docker system prune -a --volumes",
      },
      {
        type: "commands",
        title: "Kill process on a port",
        description: "Find and stop whatever is listening on port 3000",
        language: "bash",
        content: "lsof -ti :3000 | xargs kill -9",
      },
      {
        type: "commands",
        title: "Check outdated packages",
        description: "List dependencies with newer versions available",
        language: "bash",
        content: "npm outdated",
      },
    ],
  },
  {
    name: "Design Resources",
    description: "UI/UX resources and references",
    defaultType: "links",
    items: [
      {
        type: "links",
        title: "Tailwind CSS Docs",
        description: "Utility classes and configuration reference for Tailwind CSS",
        url: "https://tailwindcss.com/docs",
        isFavorite: true,
      },
      {
        type: "links",
        title: "shadcn/ui",
        description: "Accessible, copy-and-paste React components",
        url: "https://ui.shadcn.com",
      },
      {
        type: "links",
        title: "Material Design 3",
        description: "Google's design system: guidelines, components and tokens",
        url: "https://m3.material.io",
      },
      {
        type: "links",
        title: "Lucide Icons",
        description: "Open-source icon library used across DevStash",
        url: "https://lucide.dev/icons",
      },
    ],
  },
];

async function seedItemTypes() {
  const typeIds = new Map<TypeSlug, string>();

  for (const type of SYSTEM_TYPES) {
    // Postgres treats NULLs as distinct in unique constraints, so look up
    // system types by slug + null userId instead of relying on upsert
    const existing = await prisma.itemType.findFirst({
      where: { slug: type.slug, userId: null },
    });

    const saved = existing
      ? await prisma.itemType.update({
          where: { id: existing.id },
          data: { ...type, isSystem: true },
        })
      : await prisma.itemType.create({ data: { ...type, isSystem: true } });

    typeIds.set(type.slug, saved.id);
  }

  return typeIds;
}

async function seedUser() {
  const password = await bcrypt.hash(DEMO_USER.password, 12);

  return prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: { name: DEMO_USER.name, password, isPro: false },
    create: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      password,
      isPro: false,
      emailVerified: new Date(),
    },
  });
}

async function seedCollections(userId: string, typeIds: Map<TypeSlug, string>) {
  // Start from a clean slate so re-running the seed doesn't duplicate data
  await prisma.item.deleteMany({ where: { userId } });
  await prisma.collection.deleteMany({ where: { userId } });

  for (const collection of COLLECTIONS) {
    const saved = await prisma.collection.create({
      data: {
        name: collection.name,
        description: collection.description,
        isFavorite: collection.isFavorite ?? false,
        userId,
        defaultTypeId: typeIds.get(collection.defaultType),
      },
    });

    for (const item of collection.items) {
      const type = SYSTEM_TYPES.find((t) => t.slug === item.type)!;
      await prisma.item.create({
        data: {
          title: item.title,
          description: item.description,
          contentType: type.contentType,
          content: item.content ?? null,
          language: item.language ?? null,
          url: item.url ?? null,
          isPinned: item.isPinned ?? false,
          isFavorite: item.isFavorite ?? false,
          userId,
          itemTypeId: typeIds.get(item.type)!,
          collections: { create: { collectionId: saved.id } },
        },
      });
    }
  }
}

async function main() {
  const typeIds = await seedItemTypes();
  const user = await seedUser();
  await seedCollections(user.id, typeIds);

  const itemCount = COLLECTIONS.reduce((sum, c) => sum + c.items.length, 0);
  console.log(
    `Seeded ${SYSTEM_TYPES.length} system item types, demo user ${user.email}, ` +
      `${COLLECTIONS.length} collections and ${itemCount} items`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
