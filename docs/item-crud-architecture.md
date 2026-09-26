# Item CRUD Architecture

A single CRUD system for all 7 item types (Snippet, Prompt, Command, Note, File, Image, Link). One action file handles mutations, `lib/db` handles reads, one dynamic route lists items of any type, and shared components change their behavior based on the type.

**Sources:** `context/project-overview.md`, `docs/item-types.md`, `prisma/schema.prisma`, `src/lib/item-type-icons.ts`, and the existing patterns in `src/actions/profile.ts`, `src/lib/db/items.ts`, `src/app/dashboard/*` and `src/proxy.ts`. Two sources named in the research prompt don't exist: `docs/content-types.md` (replaced by `docs/item-types.md`) and `src/lib/constants.tsx` (the constants are in `src/lib/item-type-icons.ts`).

---

## Design principles

- **Actions don't know about types.** `createItem`, `updateItem` and `deleteItem` work for every type. They branch only on the content kind (`TEXT`, `URL`, `FILE`) by picking a Zod schema, never on the type's slug.
- **Type-specific logic lives in components.** Which editor to show, whether a language picker appears and how content is rendered come from a per-type UI config read by the components.
- **Reads in `lib/db`, writes in actions.** Server components call `lib/db` directly; client components change data through server actions.
- **The server decides the content kind.** The action looks up the `ItemType` and uses its `contentType`. The value sent by the client is never trusted.
- **Every query is scoped by `userId`**, as the dashboard queries already are.

---

## File structure

```
src/
├── actions/
│   └── items.ts                 NEW     createItem, updateItem, deleteItem
├── app/
│   └── items/
│       ├── layout.tsx           NEW     DashboardShell + sidebar data (like profile/layout.tsx)
│       └── [type]/
│           ├── page.tsx         NEW     items of one type; drawer via ?item= / ?new=
│           └── not-found.tsx    NEW     unknown type slug
├── components/
│   └── items/                   NEW     shared item components (see Components)
│       └── ItemCard.tsx         MOVED   from components/dashboard/
├── lib/
│   ├── db/items.ts              EXTEND  getItemTypeBySlug, getItemsByType, getItemById
│   ├── validations/items.ts     NEW     Zod schemas per content kind
│   ├── item-type-config.ts      NEW     per-type UI config
│   ├── item-type-icons.ts       KEEP    icon and color maps
│   └── plan.ts                  NEW     hasProAccess, FREE_LIMITS (from the overview)
├── types/items.ts               EXTEND  ItemDetail, ItemFormValues, ItemActionResult
└── proxy.ts                     EXTEND  add /items/:path* to the matcher
```

`ItemCard` moves out of the dashboard folder so the dashboard and the type pages can share it.

---

## Routing: `/items/[type]`

The sidebar already links each type to `/items/<slug>`. A request goes through these steps:

1. `src/proxy.ts` redirects signed-out users to `/sign-in?callbackUrl=...`.
2. `items/layout.tsx` calls `await connection()`, loads the sidebar data and renders `DashboardShell`.
3. `items/[type]/page.tsx` awaits `params` and `searchParams` (both are promises in Next.js 16; the page is typed with `PageProps<"/items/[type]">`).
4. The page reads the session and redirects to sign-in if there's no user ID.
5. `getItemTypeBySlug(userId, type)` finds a system type or one of the user's custom types. If there's none, the page calls `notFound()`.
6. `getItemsByType` and, when `?item=<id>` is set, `getItemById` run in parallel.
7. The page renders `ItemsHeader`, `ItemGrid` and, if an item was requested, `ItemDrawer` open on it.

Example URLs:

- `/items/snippets`: all of the user's snippets
- `/items/snippets?item=abc`: the list with item `abc` open in the drawer, so the link can be shared and survives a refresh
- `/items/snippets?new=1`: the list with the drawer open on an empty create form
- `/items/unknown`: 404

Items don't get their own route; the drawer is the detail view, as the overview specifies. Opening and closing the drawer updates the query string with `router.replace`, so the list doesn't reload.

---

## Data fetching (`src/lib/db/items.ts`)

| Function | Returns | Notes |
| --- | --- | --- |
| `getItemTypeBySlug(userId, slug)` | `ItemTypeSummary \| null` | `where: { slug, OR: [{ userId: null }, { userId }] }` |
| `getItemsByType(userId, itemTypeId)` | `ItemSummary[]` | Pinned first, then `updatedAt` desc; reuses `ITEM_SUMMARY_INCLUDE` and `toItemSummary` |
| `getItemById(userId, id)` | `ItemDetail \| null` | `findFirst({ where: { id, userId } })` with content, URL, file fields, tags and collection IDs |

The existing dashboard queries stay as they are. `ItemSummary` stays light (no `content`) for lists, and the new `ItemDetail` adds `content`, `language`, `url`, the `file*` fields and `collectionIds` for the drawer.

---

## Mutations (`src/actions/items.ts`)

All three actions follow `src/actions/profile.ts`: `"use server"`, read the session, validate with Zod, wrap the database work in `try/catch`, and return `{ success, data?, error?, fieldErrors? }`.

### `createItem`

1. Check the session.
2. Load the item type by ID; it must be a system type or owned by the user.
3. If the type is `isProOnly`, check `hasProAccess`.
4. Check the free plan's item limit.
5. Validate with the schema for the type's `contentType`.
6. Create the item with its tags (`connectOrCreate` on `[userId, name]`) and collections (only IDs the user owns).
7. Revalidate.

### `updateItem`

1. Check the session.
2. Load the item by `id` and `userId`; return "Item not found" if it's missing.
3. Validate with the schema for the item's existing `contentType`.
4. Update the fields and replace its tags and collections.
5. Revalidate.

### `deleteItem`

1. Check the session.
2. `deleteMany({ where: { id, userId } })`; zero deleted rows means "Item not found". Collection and tag join rows are removed by cascade.
3. Revalidate.

### Decisions

- An item's type can't be changed after creation.
- Fields that belong to other content kinds are written as `null`, so a text item never keeps a stray `url`.
- `revalidatePath("/", "layout")` refreshes the type page, the dashboard and the sidebar counts in one call.
- File and Image uploads are out of scope for the first version. The action will accept the `file*` fields once the presigned R2 flow (`/api/uploads`) exists.
- Pin, favorite and "last used" updates can come later as small actions in the same file.

### Validation (`src/lib/validations/items.ts`)

A base schema covers the fields every item has: `title` (trimmed, 1–200 characters), optional `description`, `tags` (trimmed, lowercased, deduplicated, at most 20) and `collectionIds`. Three content schemas extend it:

- **Text:** `content` required, `language` optional
- **URL:** `url`, http or https only
- **File:** `fileUrl`, `fileName`, `fileSize` and `fileMimeType`, all required

`getItemSchema(contentType)` returns the base schema merged with the matching content schema. Because the action picks the schema from the database `contentType`, validation depends on the content kind, not the type name.

---

## Where type-specific logic lives

The actions know only the three content kinds, and `lib/db` knows nothing type-specific. Everything that differs between, say, a Snippet and a Note is in `src/lib/item-type-config.ts` and the components that read it:

| Slug | Editor | Language picker | Viewer |
| --- | --- | --- | --- |
| `snippets` | Code | Yes (default `typescript`) | Syntax-highlighted code |
| `prompts` | Markdown | No | Markdown |
| `commands` | Code | Yes (default `bash`) | Code with copy button |
| `notes` | Markdown | No | Markdown |
| `links` | URL input | No | Link |
| `files` | File upload | No | File name, size and download |
| `images` | Image upload | No | Image preview |

The config also holds per-type placeholders. Custom types, when they arrive, fall back to a default config based on their `contentType`.

---

## Components (`src/components/items/`)

| Component | Kind | Responsibility |
| --- | --- | --- |
| `ItemsHeader` | Server | Type icon, name, count and a New button (`?new=1`); upgrade prompt for Pro-only types when plans are enforced |
| `ItemGrid` | Server | Lays out `ItemCard`s, with an empty state per type |
| `ItemCard` | Server | Card with the type's icon and border color, linking to `?item=<id>` |
| `ItemDrawer` | Client | shadcn `Sheet` opened from the URL; shows `ItemView` or `ItemForm`; closing removes the query param |
| `ItemView` | Client | Title, description, tags, collections, dates and the content viewer, plus Edit, Delete and Copy |
| `ItemForm` | Client | Shared fields plus `ItemContentField`; submits `createItem` or `updateItem` with `useActionState`; inline field errors and a success toast |
| `ItemContentField` | Client | Picks `CodeEditorField`, `MarkdownField`, `UrlField` or `FileUploadField` from the config |
| `ItemContentViewer` | Client | Picks `CodeViewer`, `MarkdownViewer`, `LinkViewer`, `FileViewer` or `ImageViewer` from the config |
| `LanguageSelect` | Client | Shown only when the config enables it |
| `DeleteItemDialog` | Client | shadcn `AlertDialog` that calls `deleteItem`, shows a toast and closes the drawer |
| `NewItemButton` | Client | Replaces the static top bar button; asks for a type, then opens the create drawer |

How the pieces connect:

- **List:** `page.tsx` loads items from `lib/db` and passes them to `ItemGrid`.
- **View:** clicking an `ItemCard` sets `?item=<id>`; the page loads the item and opens `ItemDrawer` on `ItemView`.
- **Create:** `?new=1` opens `ItemForm`; on success the drawer switches to the new item.
- **Update:** Edit in `ItemView` swaps in `ItemForm` with the current values; on success it switches back.
- **Delete:** `DeleteItemDialog` deletes the item and closes the drawer.

---

## Implementation order

1. `/items/[type]` route, layout, proxy matcher and list queries (read-only)
2. Drawer with `ItemView` and `getItemById`
3. Validation schemas, `createItem` and `ItemForm` for text and URL types
4. `updateItem` and edit mode
5. `deleteItem` and `DeleteItemDialog`
6. `src/lib/plan.ts` gating for Pro-only types and free limits
7. File and Image uploads through R2

## Open questions

- **Editors:** a plain `textarea` first, or a library such as CodeMirror or Monaco from the start?
- **Syntax highlighting:** Shiki, as the overview suggests, rendered on the server or the client?
- **Tags input:** comma-separated free text, or a combobox of existing tags?
- **Mobile drawer:** a full-screen `Sheet`, or a separate page?
