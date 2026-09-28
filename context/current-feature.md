# Current Feature: Collections Pages

<!-- Feature name and short description -->

Add a `/collections` page listing all of the user's collections and a `/collections/[id]` page showing the items in one collection, using the existing cards.

## Status

<!-- Not Started | In Progress | Completed -->

In Progress

## Goals

<!-- Goals and requirements -->

- `getCollections(userId)` in `src/lib/db/collections.ts`: all of the user's collections as `CollectionSummary`, favorites first, then most recently updated
- `/collections` page: header with a "New Collection" button, a responsive grid of the existing `CollectionCard`s, and an empty state
- `getCollectionById(userId, id)` and `getItemsByCollection(userId, collectionId)` in `src/lib/db`: scoped to the user, so another user's collection is a 404; items pinned first, then newest
- `/collections/[id]` page: collection name, description and item count, then the items as the existing `ItemCard`s (clicking opens the item drawer), with an empty state
- `src/app/collections/layout.tsx` renders inside `DashboardShell` like `/items`, and `/collections/:path*` is added to the proxy matcher
- Loading skeletons for both pages, following `/items/[type]`
- "View all collections" in the sidebar, "View all" on the dashboard and every collection card (dashboard cards and sidebar links) go to these pages
- Vitest tests for the new queries

## Notes

<!-- Any extra notes -->

- The links already exist: `CollectionCard` and `SidebarCollectionLink` point to `/collections/${id}`, and the sidebar's "View all collections" and the dashboard's "View all" point to `/collections`. Those routes currently 404, so this feature mainly adds the pages
- A collection holds items of any type, so the detail page uses the `ItemCard` grid rather than the image gallery or file list layouts
- Editing or deleting a collection, and removing items from it on this page, are out of scope

## Progress

<!-- Step checklist, updated before every step. Cleared when the feature is completed -->

`/feature complete`:

- [x] ~~1. Run `npm test` and `npm run build` (tests passed; build skipped at your request, it passed before and no code changed since)~~
- [ ] **2. Stage all changes and commit the feature ← current**
- [ ] 3. Switch to main and merge the feature branch
- [ ] 4. Delete the local feature branch
- [ ] 5. Append the full summary to feature-history.md
- [ ] 6. Reset current-feature.md (clears this Progress section) and add the one-line Completed Features entry
- [ ] 7. Commit both context files
- [ ] 8. Push main to origin
- [ ] 9. Delete the remote feature branch if it was pushed

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
