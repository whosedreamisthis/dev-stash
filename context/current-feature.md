# Current Feature

<!-- Feature name and short description -->

File List View: show `/items/files` as a single-column file list (like Google Drive or Dropbox) instead of grid cards.

## Status

<!-- Not Started | In Progress | Completed -->

In Progress

## Goals

<!-- Goals and requirements -->

- Single-column list of rows on `/items/files` instead of the card grid
- Each row shows a file icon chosen by extension, the file name, the file size, the upload date and a download button
- Rows highlight on hover
- Clicking a row opens the item drawer
- The download button downloads the file directly and doesn't open the drawer (stops propagation)
- Responsive: the row's details stack vertically on mobile

## Notes

<!-- Any extra notes -->

- Spec: `context/features/file-display-spec.md`
- `/items/[type]` renders `ItemGrid`, which already switches layouts by type through `src/lib/item-grid.ts` (the images gallery); files become a second special layout there, with a matching `ItemGridSkeleton` variant for the page's Suspense fallback and `loading.tsx`.
- `ItemSummary` has no file fields. `getItemsByType` already loads full item rows, so `toItemSummary` (or a file-row mapping) only needs to pass `fileName` and `fileSize` through; no schema change.
- Open question: the spec says the row shows the file name, but items also have a title. Likely the title as the main text with the file name beside or below it, or the file name alone.
- Download goes through the existing proxy `/api/items/[id]/file`, reusing the `<a download>` pattern from `ItemFileContent`. With `ItemCard`'s full-card overlay button, the download link needs to sit above the overlay (z-index) as well as stop propagation.
- Upload date = the item's `createdAt`. File size uses `formatFileSize` from `src/lib/upload-constraints.ts`.
- Extension-to-icon mapping (e.g. pdf/txt/md → `FileText`, json → `FileJson`, csv → `FileSpreadsheet`, xml/yaml/yml/toml/ini → `FileCode`, fallback `File`) is a pure utility worth a unit test.
- Dashboard pinned and recent lists keep `ItemCard` for files, as with images.

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
