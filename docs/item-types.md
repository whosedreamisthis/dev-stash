# Item Types

DevStash stores every piece of saved content as an **Item**, and every Item belongs to an **ItemType**. The app ships with seven **system types**, which are shared by all users and can't be edited or deleted. User-created custom types are planned as a later Pro feature.

| Source | What it provides |
| --- | --- |
| `context/project-overview.md` | Spec: types, colors, icons, plans, AI features |
| `prisma/schema.prisma` | `ItemType`, `Item` and `ContentType` definitions |
| `prisma/seed.ts` | System type values and demo items |
| `src/lib/item-type-icons.ts` | Icon and Tailwind color maps (`src/lib/constants.tsx`, listed in the research prompt, doesn't exist) |
| `src/lib/db/items.ts`, `src/components/**` | How types are queried and displayed |

---

## Overview

| Type | Slug / route | Lucide icon | Color | Content type | Plan |
| --- | --- | --- | --- | --- | --- |
| Snippet | `snippets` → `/items/snippets` | `Code` | `#3b82f6` (blue) | `TEXT` | Free |
| Prompt | `prompts` → `/items/prompts` | `Sparkles` | `#8b5cf6` (purple) | `TEXT` | Free |
| Command | `commands` → `/items/commands` | `Terminal` | `#f97316` (orange) | `TEXT` | Free |
| Note | `notes` → `/items/notes` | `StickyNote` | `#fde047` (yellow) | `TEXT` | Free |
| File | `files` → `/items/files` | `File` | `#6b7280` (gray) | `FILE` | **Pro** |
| Image | `images` → `/items/images` | `Image` | `#ec4899` (pink) | `FILE` | **Pro** |
| Link | `links` → `/items/links` | `Link` | `#10b981` (emerald) | `URL` | Free |

The rows are in seed order, which is also the sidebar order (`getSidebarItemTypes` sorts system types by `createdAt`).

---

## Purpose and key fields

| Type | Purpose | Key fields | Notes |
| --- | --- | --- | --- |
| Snippet | Reusable code: hooks, utilities, components, config files | `content` (code), `language` (e.g. `typescript`, `dockerfile`) | Syntax highlighting planned |
| Prompt | AI prompts, system messages, workflow instructions, often with `{{placeholder}}` variables | `content` (prompt text) | Seeded prompts leave `language` empty; Prompt Optimizer planned (Pro) |
| Command | Shell commands, usually one line, to copy and run | `content` (command), `language` (seeded as `bash`) | — |
| Note | Free-form Markdown notes, explanations, course notes | `content` (Markdown), optional `language` | `#fde047` is very light: use dark text on it and check light-mode contrast |
| File | Uploaded documents such as context files and templates | `fileUrl`, `fileName`, `fileSize`, `fileMimeType` | Stored in Cloudflare R2; `content` is null |
| Image | Uploaded screenshots, diagrams, design references | `fileUrl`, `fileName`, `fileSize`, `fileMimeType` | `fileMimeType` drives rendering and validation |
| Link | Bookmarks to docs, tools and references | `url` | `content` and `language` are null |

---

## Seed data

| Type | Seeded items | Collection |
| --- | --- | --- |
| Snippet | useDebounce & useLocalStorage hooks, Context provider & compound components, Utility functions | React Patterns |
| Snippet | Next.js Dockerfile & GitHub Actions CI | DevOps |
| Prompt | Code review, Documentation generation, Refactoring assistance | AI Workflows |
| Command | Undo last commit (keep changes), Clean up Docker, Kill process on a port, Check outdated packages | Terminal Commands |
| Command | Deploy with migrations | DevOps |
| Link | Docker Docs, GitHub Actions Docs | DevOps |
| Link | Tailwind CSS Docs, shadcn/ui, Material Design 3, Lucide Icons | Design Resources |
| Note | — | — |
| File | — | — |
| Image | — | — |

---

## Classification by content type

The `ContentType` enum (`TEXT | URL | FILE`) is stored on both `ItemType` and `Item`. The seed copies the type's value onto each item it creates.

| Content type | Types | Fields used | Storage |
| --- | --- | --- | --- |
| `TEXT` | Snippet, Prompt, Command, Note | `content`, `language` (optional) | Postgres column |
| `URL` | Link | `url` | Postgres column |
| `FILE` | File, Image | `fileUrl`, `fileName`, `fileSize`, `fileMimeType` | File in Cloudflare R2, metadata in Postgres |

All content fields are nullable, so the schema doesn't enforce which ones are set. That has to be checked with Zod on the server.

---

## Shared properties

### `ItemType` fields

| Field | Notes |
| --- | --- |
| `name`, `slug` | Slug is the plural route segment; `@@unique([userId, slug])` |
| `icon` | Lucide icon name, mapped to a component by `ITEM_TYPE_ICONS` |
| `color` | Hex string |
| `contentType` | `TEXT`, `URL` or `FILE` |
| `isSystem` | `true` for the seven built-in types |
| `isProOnly` | `true` for File and Image; drives the sidebar PRO badge |
| `userId` | `null` for system types; set for custom types |

Postgres treats `NULL`s as distinct in unique constraints, so `@@unique([userId, slug])` doesn't stop duplicate system types. The seed looks each type up by `slug` with `userId: null` before creating or updating it.

### `Item` fields common to all types

| Field | Purpose |
| --- | --- |
| `title` | Required display name |
| `description` | Optional short summary |
| `isFavorite` | Favorites list and stats |
| `isPinned` | Pinned section on the dashboard |
| `lastUsedAt` | "Recently used" ordering |
| `userId` | Owner; all queries are scoped by it |
| `itemTypeId` | The item's type |
| `collections` | Many-to-many via `ItemCollection` |
| `tags` | Many-to-many via `ItemTag` |
| `createdAt`, `updatedAt` | Timestamps; `createdAt` is shown on cards |

---

## Database models

From `prisma/schema.prisma`.

### `ItemType`

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | Yes | `cuid()` | Primary key |
| `name` | `String` | Yes | — | e.g. "Snippet" |
| `slug` | `String` | Yes | — | e.g. "snippets" → `/items/snippets` |
| `icon` | `String` | Yes | — | Lucide icon name |
| `color` | `String` | Yes | — | Hex color |
| `contentType` | `ContentType` | Yes | — | `TEXT`, `URL` or `FILE` |
| `isSystem` | `Boolean` | Yes | `false` | Seed sets `true` |
| `isProOnly` | `Boolean` | Yes | `false` | |
| `userId` | `String` | No | — | `null` for system types; cascades on user delete |
| `items` | `Item[]` | — | — | Items of this type |
| `defaultCollections` | `Collection[]` | — | — | Collections using this as their default type |
| `createdAt` | `DateTime` | Yes | `now()` | Sidebar sort order |
| `updatedAt` | `DateTime` | Yes | `@updatedAt` | |

| Constraint / index | Fields |
| --- | --- |
| Unique | `[userId, slug]` |
| Index | `[userId]` |

### `Item`

| Field | Type | Required | Default | Content type |
| --- | --- | --- | --- | --- |
| `id` | `String` | Yes | `cuid()` | All |
| `title` | `String` | Yes | — | All |
| `description` | `String` | No | — | All |
| `contentType` | `ContentType` | Yes | — | All |
| `content` | `String` | No | — | `TEXT` |
| `language` | `String` | No | — | `TEXT` |
| `url` | `String` | No | — | `URL` |
| `fileUrl` | `String` | No | — | `FILE` |
| `fileName` | `String` | No | — | `FILE` |
| `fileSize` | `Int` | No | — | `FILE` (bytes) |
| `fileMimeType` | `String` | No | — | `FILE` |
| `isFavorite` | `Boolean` | Yes | `false` | All |
| `isPinned` | `Boolean` | Yes | `false` | All |
| `lastUsedAt` | `DateTime` | No | — | All |
| `userId` | `String` | Yes | — | All (cascades on user delete) |
| `itemTypeId` | `String` | Yes | — | All (no cascade: a type with items can't be deleted) |
| `collections` | `ItemCollection[]` | — | — | All |
| `tags` | `ItemTag[]` | — | — | All |
| `createdAt` | `DateTime` | Yes | `now()` | All |
| `updatedAt` | `DateTime` | Yes | `@updatedAt` | All |

| Index | Supports |
| --- | --- |
| `[userId]` | All of a user's items |
| `[userId, itemTypeId]` | `/items/[type]` pages and per-type counts |
| `[userId, isPinned]` | Pinned items |
| `[userId, lastUsedAt]` | Recently used items |
| `[itemTypeId]` | Items per type |

---

## Display differences

Styling is keyed by **slug** in `src/lib/item-type-icons.ts`, using static Tailwind classes so they're detected at build time.

| Map | Keyed by | Used for | Used in |
| --- | --- | --- | --- |
| `ITEM_TYPE_ICONS` | Icon name | Type icon | Item cards, collection cards, sidebar, profile usage stats |
| `ITEM_TYPE_TEXT_COLORS` | Slug | Icon color | Item cards, collection cards, sidebar, profile usage stats |
| `ITEM_TYPE_BORDER_COLORS` | Slug | Thin border on all sides | Item cards (item's type), collection cards (most-used type) |
| `ITEM_TYPE_BG_COLORS` | Slug | Colored dot | Sidebar recent collections (most-used type) |

| Behavior | Details |
| --- | --- |
| Pro badge | File and Image show an outline PRO badge in the sidebar, based on `isProOnly` |
| Collection color | Most-used item type in the collection, falling back to `defaultTypeId` when empty |
| Item cards today | Same layout for every type: icon, title, pin/favorite markers, description, tags, date |

### Planned type-specific rendering

| Content type | Planned display |
| --- | --- |
| `TEXT` with `language` | Syntax-highlighted code block |
| `TEXT` (Note, Prompt) | Rendered Markdown |
| `URL` | Clickable link |
| `FILE` (File) | Download with file name and size |
| `FILE` (Image) | Image preview |

---

## Observations

| # | Issue | Impact |
| --- | --- | --- |
| 1 | The `ItemType.color` column isn't used for styling; the UI reads the hard-coded slug maps | Custom types would get no color or border, and only the seven imported Lucide icons would render |
| 2 | Colors and icons are defined in the seed, `item-type-icons.ts` and the project overview | Changing a color means updating all three |
| 3 | Sidebar order puts File and Image before Link; the overview lists Link first | Docs and UI disagree on order |
| 4 | No seed items for Note, File or Image | Those types show empty in the demo |
| 5 | `contentType` is stored on both `ItemType` and `Item` | Nothing checks that they match |
