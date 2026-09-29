# Current Feature: Homepage Mockup

<!-- Feature name and short description -->

A static marketing homepage prototype for DevStash in `prototypes/homepage/` (`index.html`, `styles.css`, `script.js`), built around a "chaos to order" hero.

## Status

<!-- Not Started | In Progress | Completed -->

In Progress

## Goals

<!-- Goals and requirements -->

- Create `prototypes/homepage/index.html`, `styles.css` and `script.js` (plain HTML/CSS/JS, dark theme)
- **Navigation:** fixed top nav with logo, Features/Pricing links, Sign In and Get Started buttons; gets more opaque on scroll
- **Hero text:** "Stop Losing Your Developer Knowledge" headline with gradient text, subheadline about scattered knowledge, CTA buttons
- **Hero visual (main focus):** three elements side by side
  - Chaos container "Your knowledge today..." with 8 floating icons (Notion, GitHub, Slack, VS Code, browser tabs, terminal, text file, bookmark) that drift, bounce off walls, rotate/scale subtly and repel from the mouse cursor (`requestAnimationFrame`)
  - Center transform arrow with a CSS pulse animation
  - Dashboard preview "...with DevStash": sidebar with nav items and a grid of item cards with type-colored top borders
- **Features:** 6 cards (Code Snippets, AI Prompts, Instant Search, Commands, Files & Docs, Collections), each using its item type accent color
- **AI section:** two columns: "Pro Feature" badge + AI capability checklist on the left; code editor mockup with an "AI Generated Tags" demo on the right
- **Pricing:** Free ($0, 50 items, 3 collections) vs Pro ($8/mo, unlimited, AI features); Pro highlighted with "Most Popular" badge; monthly/yearly toggle ($72/yr)
- **CTA:** "Ready to Organize Your Knowledge?" with a button
- **Footer:** logo, link columns, copyright with the current year
- **Scroll animations:** elements fade in as they scroll into view
- **Responsive:** on mobile the chaos/arrow/dashboard stack vertically, the arrow rotates 90° to point down, and grids become single column
- **App card borders (from the mockup):** item, image and collection cards get a 3px type-colored top border and a neutral border that turns the type color on hover (`ITEM_TYPE_BORDER_COLORS` in `src/lib/item-type-icons.ts`)

## Notes

<!-- Any extra notes -->

- Spec: `context/features/homepage-mockup-spec.md`.
- Standalone prototype, not part of the Next.js app: no Tailwind, shadcn, Prisma or tests; no build step needed for it.
- The spec's accent palette differs from the app's type colors: Snippet `#3b82f6`, Prompt `#f59e0b`, Command `#06b6d4`, Note `#22c55e`, File `#64748b`, Image `#ec4899`, URL `#6366f1` (app uses purple prompts, orange commands, yellow notes, gray files, emerald links).
- Brand logos (Notion, GitHub, Slack, VS Code) should be simple inline SVG icons.

## Completed Features

<!-- One line per completed feature, earliest to latest. Full details in context/feature-history.md -->

- **Initial setup:** Next.js 16 + React 19, TypeScript, Tailwind v4, ESLint; boilerplate removed.
- **Dashboard UI Phase 1:** shadcn/ui with dark mode default; `/dashboard` layout shell with sidebar and top bar.
- **Dashboard UI Phase 2:** sidebar with item types, collections and user area; collapses on desktop, Sheet on mobile.
- **Dashboard UI Phase 3:** dashboard main area: stats cards, collection cards, pinned and recent item cards.
- **Prisma + Neon PostgreSQL Setup:** Prisma 7 with the Neon adapter (`src/lib/db.ts`), initial schema and migration, system type seed.
- **Seed Data:** demo user `demo@devstash.io` with 5 collections and 18 items.
- **Dashboard Collections:** collection cards and stats from the database (`src/lib/db/collections.ts`).
- **Dashboard Items:** pinned, recent items and item stats from the database (`src/lib/db/items.ts`).
- **Stats & Sidebar:** sidebar types and collections from the database.
- **Add Pro Badge to Sidebar:** PRO badge on Pro-only types from `isProOnly`.
- **Auth Setup - NextAuth + GitHub Provider:** Auth.js v5 split config (`src/auth.config.ts`, `src/auth.ts`), JWT sessions, `src/proxy.ts` route guard.
- **Auth Credentials - Email/Password Provider:** Credentials provider with bcrypt, `POST /api/auth/register`, Zod schemas in `src/lib/validations/auth.ts`.
- **Auth UI - Sign In, Register & Sign Out:** custom `/sign-in` and `/register` pages, auth server actions, sidebar user menu.
- **Email Verification on Register:** Resend emails (`src/lib/email.ts`), hashed tokens (`src/lib/verification.ts`), `/verify-email`.
- **Email Verification Toggle:** `EMAIL_VERIFICATION_ENABLED=false` turns verification off.
- **Forgot Password:** `/forgot-password` and `/reset-password` with single-use emailed links; token helpers in `src/lib/tokens.ts`.
- **Profile Page:** `/profile` with user info, usage stats, change password and delete account (`src/lib/account.ts`).
- **Auth Rate Limiting:** first limiter stored in Neon (replaced by Upstash below).
- **Rate Limiting for Auth (Upstash):** Upstash sliding-window limits on all auth flows (`src/lib/rate-limit.ts`), fails open; Sonner toasts.
- **Fix Dashboard Showing Demo User Data:** dashboard and sidebar use the session user.
- **Items List View:** `/items/[type]` grid of the user's items with loading skeletons.
- **Vitest Setup:** Vitest for server actions and utilities; tests sit next to the code as `*.test.ts`.
- **Item Drawer:** item details in a right-side Sheet via `GET /api/items/[id]`, with a per-page detail cache.
- **Item Drawer Edit Mode:** inline edit form and `updateItem` action with Zod validation (`src/lib/validations/items.ts`).
- **Delete Item:** delete confirmation dialog and `deleteItem` action.
- **Item Create:** `NewItemDialog` and `createItem` action; the type is looked up by slug on the server.
- **Item Type Dropdown:** type picker became a shadcn Select.
- **Code Editor:** Monaco `CodeEditor` for snippets and commands; type-specific "New X" buttons on items pages.
- **Markdown Editor:** `MarkdownEditor` with Write/Preview tabs for notes and prompts.
- **File & Image Upload:** UploadThing uploads with server-signed upload tokens, `FileUpload` component, download proxy `/api/items/[id]/file`; no Pro check yet.
- **Image Gallery View:** `/items/images` shows `ImageThumbnailCard` thumbnails in a 1/2/3-column gallery; layout shared via `src/lib/item-grid.ts`.
- **File List View:** `/items/files` shows `FileListRow` rows with extension icons (`src/lib/file-icons.ts`, `FileTypeIcon`) and a Download button.
- **Quick Copy on Cards:** `CopyButton` on `ItemCard` copies `ItemSummary.copyText` (content or URL) without opening the drawer.
- **Audit Fixes:** item field length limits (`ITEM_LIMITS`), `NewItemDialog` split with shared `src/lib/item-fields.ts`, no SVG uploads, no Monaco import errors in TS snippets.
- **Extract Helpers Refactor:** `toTagLinks`, `createUser` (`src/lib/db/users.ts`), `getSessionUserId` (`src/lib/session.ts`), split `Sidebar` links, upload hooks moved to `src/hooks/`.
- **Collection Create:** top bar `NewCollectionDialog` (name + description) with `createCollection` action (`src/actions/collections.ts`), user-scoped query and Zod schema; refreshes on save.
- **Add Items to Collections:** `CollectionSelector` multi-select in the new/edit item forms, options from `GET /api/collections`; queries link only the user's own collections.
- **Collections Pages:** `/collections` grid of `CollectionCard`s and `/collections/[id]` with streamed `ItemCard`s; clicked collections show their name instantly (`src/lib/collection-preview.ts`).
- **Collection Card Actions:** Edit/Delete (items kept) via `EditCollectionDialog` and `DeleteCollectionDialog` in the collection header and a `CollectionCard` 3-dot menu; Favorite shown but disabled.
- **Global Search / Command Palette:** Cmd+K / Ctrl+K `CommandPalette` fuzzy searches items and collections in the browser, with data from the `getSearchData` action (`src/actions/search.ts`); the TopBar search box opens it.
- **Pagination:** server-side `?page=N` pagination (21 per page) on `/items/[type]`, `/collections` and `/collections/[id]` via `src/lib/pagination.ts` and the `Pagination` component.
- **Replace API Routes with Server Actions:** `getItem`, `getCollectionOptions` and `registerUser` actions replace `/api/items/[id]`, `/api/collections` and `/api/auth/register`; only callback/file routes remain.
- **Settings Page:** protected `/settings` with change password and delete account (moved from `/profile`, components in `src/components/settings/`), linked from the sidebar user menu.
- **Editor Preferences Settings:** auto-saving Editor section on `/settings` (font, tab size, wrap, minimap, theme) stored in `User.editorPreferences`, shared via `EditorPreferencesContext` and applied to `CodeEditor`.
- **Favorites Page:** protected `/favorites` (TopBar star link) with compact monospace Items and Collections lists from `getFavoriteItems`/`getFavoriteCollections`; components in `src/components/favorites/`.
- **Favorite Toggle:** optimistic favorite toggles (`useFavoriteToggle`) in the item drawer, item/image cards (`ItemFavoriteButton`), collection header and card menu via `setItemFavorite`/`setCollectionFavorite` actions.
- **Favorites Sorting:** per-section sort dropdowns on `/favorites` (items: date/name/type, collections: date/name) in `FavoritesList`, with helpers in `src/lib/favorites-sort.ts`.
- **Pinned Items:** item drawer Pin button toggles pins optimistically with toasts via the `toggleItemPin` action and shared `useOptimisticToggle` hook; pinned items lead listings and the dashboard.
