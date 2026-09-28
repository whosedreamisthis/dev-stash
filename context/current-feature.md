# Current Feature

<!-- Feature name and short description -->

Image Gallery View: show image items as a 3-column gallery of thumbnail cards instead of the regular item cards.

## Status

<!-- Not Started | In Progress | Completed -->

In Progress

## Goals

<!-- Goals and requirements -->

- Create an image thumbnail card that replaces the regular `ItemCard` for image items
- Show images in a 3-column grid/gallery
- Show each thumbnail at a 16:9 ratio (`aspect-video`) with `object-cover`, so it fills the card and may crop edges
- Add a subtle hover zoom on the thumbnail (5% scale, 300ms transition)

## Notes

<!-- Any extra notes -->

- Spec: `context/features/image-display-spec.md`
- Assumed scope: the `/items/images` page. The spec doesn't say whether dashboard lists (pinned/recent) should also use thumbnail cards; they keep `ItemCard` unless decided otherwise.
- `/items/[type]` renders `ItemGrid` (`src/components/items/ItemGrid.tsx`), a 1-column / 2-column-from-`md` grid of `ItemCard` (`src/components/dashboard/ItemCard.tsx`); its loading state uses `ItemGridSkeleton`, which should match the gallery layout on the images page.
- Thumbnails can load from the existing download proxy `/api/items/[id]/file` (owner-only, `Cache-Control: private, max-age=300`); `<img>` renders it despite the attachment header. `ItemSummary` has no file fields, but the card only needs the item ID.
- The thumbnail card should still open the item drawer on click and prefetch on hover/focus like `ItemCard`, and show the title (and likely pin/favorite markers).
- 3 columns on a phone is too narrow; likely 1 → 2 → 3 columns across breakpoints, with 3 on desktop.
- Clip the zoom with `overflow-hidden` on the thumbnail wrapper so the scaled image stays inside the card.

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
