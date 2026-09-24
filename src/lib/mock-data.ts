// Temporary mock data for the dashboard UI. Replace with Prisma queries once the database is in place.

export type ContentType = "TEXT" | "URL" | "FILE";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
}

export interface MockItemType {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  contentType: ContentType;
  isProOnly: boolean;
  count: number;
}

export interface MockCollection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  typeIds: string[];
  defaultTypeId: string;
}

export interface MockItem {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  content: string | null;
  language: string | null;
  url: string | null;
  typeId: string;
  collectionIds: string[];
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  lastUsedAt: string;
}

export const currentUser: MockUser = {
  id: "user_1",
  name: "John Doe",
  email: "john@example.com",
  image: null,
  isPro: false,
};

export const itemTypes: MockItemType[] = [
  { id: "type_snippet", name: "Snippet", slug: "snippets", icon: "Code", color: "#3b82f6", contentType: "TEXT", isProOnly: false, count: 24 },
  { id: "type_prompt", name: "Prompt", slug: "prompts", icon: "Sparkles", color: "#8b5cf6", contentType: "TEXT", isProOnly: false, count: 18 },
  { id: "type_command", name: "Command", slug: "commands", icon: "Terminal", color: "#f97316", contentType: "TEXT", isProOnly: false, count: 15 },
  { id: "type_note", name: "Note", slug: "notes", icon: "StickyNote", color: "#fde047", contentType: "TEXT", isProOnly: false, count: 12 },
  { id: "type_file", name: "File", slug: "files", icon: "File", color: "#6b7280", contentType: "FILE", isProOnly: true, count: 5 },
  { id: "type_image", name: "Image", slug: "images", icon: "Image", color: "#ec4899", contentType: "FILE", isProOnly: true, count: 3 },
  { id: "type_link", name: "Link", slug: "links", icon: "Link", color: "#10b981", contentType: "URL", isProOnly: false, count: 8 },
];

export const mockItemTypeCounts: Record<string, number> = {
  type_snippet: 24,
  type_prompt: 18,
  type_command: 15,
  type_note: 12,
  type_file: 5,
  type_image: 3,
  type_link: 8,
};

export const collections: MockCollection[] = [
  {
    id: "col_react",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    itemCount: 12,
    typeIds: ["type_snippet", "type_note", "type_link"],
    defaultTypeId: "type_snippet",
  },
  {
    id: "col_python",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    itemCount: 8,
    typeIds: ["type_snippet", "type_note"],
    defaultTypeId: "type_snippet",
  },
  {
    id: "col_context",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    itemCount: 5,
    typeIds: ["type_file", "type_note"],
    defaultTypeId: "type_file",
  },
  {
    id: "col_interview",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    itemCount: 24,
    typeIds: ["type_note", "type_snippet", "type_link", "type_prompt"],
    defaultTypeId: "type_note",
  },
  {
    id: "col_git",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    itemCount: 15,
    typeIds: ["type_command", "type_note"],
    defaultTypeId: "type_command",
  },
  {
    id: "col_ai",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    itemCount: 18,
    typeIds: ["type_prompt", "type_snippet", "type_note"],
    defaultTypeId: "type_prompt",
  },
  {
    id: "col_resources",
    name: "Dev Resources",
    description: "Handy docs, tools and references",
    isFavorite: false,
    itemCount: 6,
    typeIds: ["type_link", "type_image", "type_note"],
    defaultTypeId: "type_link",
  },
];

export const items: MockItem[] = [
  {
    id: "item_1",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    contentType: "TEXT",
    content: `export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthChange(setUser);
  }, []);

  return { user, isSignedIn: !!user };
}`,
    language: "typescript",
    url: null,
    typeId: "type_snippet",
    collectionIds: ["col_react", "col_interview"],
    tags: ["react", "auth", "hooks"],
    isFavorite: true,
    isPinned: true,
    createdAt: "2026-01-15T10:00:00.000Z",
    lastUsedAt: "2026-09-23T14:30:00.000Z",
  },
  {
    id: "item_2",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    contentType: "TEXT",
    content: `export async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res;
    await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
  }
  throw new Error(\`Request failed after \${retries} attempts\`);
}`,
    language: "typescript",
    url: null,
    typeId: "type_snippet",
    collectionIds: ["col_react"],
    tags: ["fetch", "errors", "retry"],
    isFavorite: false,
    isPinned: true,
    createdAt: "2026-01-12T09:00:00.000Z",
    lastUsedAt: "2026-09-22T11:15:00.000Z",
  },
  {
    id: "item_3",
    title: "Undo last commit",
    description: "Reset the last commit but keep the changes staged",
    contentType: "TEXT",
    content: "git reset --soft HEAD~1",
    language: "bash",
    url: null,
    typeId: "type_command",
    collectionIds: ["col_git"],
    tags: ["git"],
    isFavorite: true,
    isPinned: false,
    createdAt: "2026-02-03T08:00:00.000Z",
    lastUsedAt: "2026-09-24T08:45:00.000Z",
  },
  {
    id: "item_4",
    title: "Code Review Prompt",
    description: "Ask the AI for a focused review of a diff",
    contentType: "TEXT",
    content:
      "Review the following diff for bugs, security issues and readability. List findings by severity and suggest concrete fixes.",
    language: null,
    url: null,
    typeId: "type_prompt",
    collectionIds: ["col_ai", "col_interview"],
    tags: ["ai", "review"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-03-10T12:00:00.000Z",
    lastUsedAt: "2026-09-21T16:00:00.000Z",
  },
  {
    id: "item_5",
    title: "Python list comprehension tricks",
    description: "Filtering and flattening with comprehensions",
    contentType: "TEXT",
    content: `evens = [n for n in nums if n % 2 == 0]
flat = [x for row in matrix for x in row]`,
    language: "python",
    url: null,
    typeId: "type_snippet",
    collectionIds: ["col_python"],
    tags: ["python", "lists"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-04-02T15:00:00.000Z",
    lastUsedAt: "2026-09-20T10:00:00.000Z",
  },
  {
    id: "item_6",
    title: "Big-O cheat sheet notes",
    description: "Time complexity of common data structure operations",
    contentType: "TEXT",
    content: "- Array access: O(1)\n- Hash map lookup: O(1) average\n- Binary search: O(log n)\n- Sorting: O(n log n)",
    language: "markdown",
    url: null,
    typeId: "type_note",
    collectionIds: ["col_interview"],
    tags: ["algorithms", "interview"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-05-18T09:30:00.000Z",
    lastUsedAt: "2026-09-19T13:20:00.000Z",
  },
  {
    id: "item_7",
    title: "React Docs",
    description: "Official React documentation",
    contentType: "URL",
    content: null,
    language: null,
    url: "https://react.dev",
    typeId: "type_link",
    collectionIds: ["col_react", "col_interview"],
    tags: ["react", "docs"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-05T07:00:00.000Z",
    lastUsedAt: "2026-09-18T09:00:00.000Z",
  },
];
