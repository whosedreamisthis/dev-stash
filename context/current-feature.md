# Current Feature: Homepage

<!-- Feature name and short description -->

Replace the placeholder `src/app/page.tsx` with the real marketing homepage, rebuilt from the `prototypes/homepage/` mockup with Tailwind and shadcn/ui.

## Status

<!-- Not Started | In Progress | Completed -->

In Progress

## Goals

<!-- Goals and requirements -->

- Public `/` route with page `metadata`; `page.tsx` only composes section components from `src/components/homepage/`
- Sections from the mockup: fixed nav, hero text, chaos → arrow → dashboard preview, 6 feature cards, Pro AI section with editor mockup and AI tags, pricing, closing CTA, footer
- Static content (features, plans, footer links, chaos icons) in data arrays in one file (e.g. `src/lib/homepage-content.ts`), mapped over rather than repeated
- Server components by default; small client components only for:
  - `ChaosIcons`: `requestAnimationFrame` drift, wall bounce, rotate/scale pulse, cursor repel, cleanup on unmount, positions scaled on resize (no bunching)
  - Nav scroll state (more opaque with a border after scrolling)
  - `PricingToggle`: shadcn `Switch`, $8/mo ↔ $72/yr ("$6/month, billed yearly")
  - Reusable `Reveal` fade-in with `IntersectionObserver` (shared hook also drives the AI tags appearing one by one)
- Reduced motion turns off icon motion, arrow pulse and fade-ins; content stays visible without JavaScript
- Tailwind v4 + shadcn (`Button`, `Badge`, `Switch`), no inline styles; custom keyframes in `src/app/globals.css`
- App type colors and icons from `src/lib/item-type-icons.ts` (not the mockup palette); preview cards use the app's card border style; brand icons (Notion, GitHub, Slack, VS Code) as small inline SVG components
- Responsive: hero stacks with the arrow pointing down, single-column grids, nav hides links and Sign In on mobile
- Links: logo → `/`; Features/Pricing/See Features → `#features`/`#pricing` with nav offset; signed out, Sign In → `/sign-in` and Get Started / Start for Free / plan / CTA buttons → `/register`; signed in (session checked in the server nav), "Go to Dashboard" and those buttons → `/dashboard`; Upgrade to Pro → `/register` or `/dashboard`
- Footer: only real links (Features, Pricing, Sign In, Register), current-year copyright
- Shared `Logo` (`src/components/shared/Logo.tsx`) links to `/`; used by the homepage nav and footer and the dashboard sidebar, so the sidebar logo leads to the homepage

## Notes

<!-- Any extra notes -->

- Spec: `context/features/homepage-spec.md`; reference mockup: `prototypes/homepage/` (keep it).
- Pricing from the project overview: Free $0 (50 items, 3 collections), Pro $8/mo or $72/yr. There's no `src/lib/plan.ts` yet, so the numbers live in the homepage content file.
- No new server actions or queries beyond reading the session. Stripe checkout isn't built, so Upgrade to Pro doesn't go to billing.
- `/` isn't in the `src/proxy.ts` matcher, so it's already public.

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
- **Homepage Mockup:** static marketing homepage prototype in `prototypes/homepage/` with an animated "chaos to order" hero; app cards gained type-colored top borders with hover outlines (`ITEM_TYPE_BORDER_COLORS`).
