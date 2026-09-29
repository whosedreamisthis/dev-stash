# Current Feature: AI Auto-Tagging

<!-- Feature name and short description -->

**AI Auto-Tagging:** a Pro-only "Suggest Tags" button in the new item dialog and the item drawer's edit mode asks Gemini `gemini-3.8-flash` for 3-5 freeform tags from the item's title and content; each suggestion can be accepted or rejected. As the first AI feature, it also sets up the Gemini foundation. Spec: `context/features/ai-auto-tag-spec.md`.

## Status

<!-- Not Started | In Progress | Completed -->

In Progress

## Goals

<!-- Goals and requirements -->

- Install `@google/genai` and add `src/lib/ai.ts`: `AI_MODEL = "gemini-3.8-flash"` and a lazily created, `server-only` Gemini client reading `GEMINI_API_KEY`
- Add an `ai` rate limit (20 requests per hour per user) to `src/lib/rate-limit.ts`
- `generateAutoTags` server action in `src/actions/ai.ts`: session check, `hasProAccess` Pro gate, Zod validation of title/content/type, content truncated to 2000 characters, rate limit, then Gemini
- Gemini call uses `generateContent` with `systemInstruction`, JSON output (`responseMimeType` + `responseJsonSchema` from `z.toJSONSchema()`), `maxOutputTokens`, `thinkingLevel: LOW` and a timeout
- Validate the reply with Zod and normalize tags (trim, lowercase, dedupe, length cap, drop tags the item already has); return `{ success, data, error }` with `rateLimited` for rate-limit errors
- Map Gemini errors to friendly messages (429 busy, 5xx unavailable, empty/blocked reply) and log raw errors server-side only
- "Suggest Tags" button (Sparkles icon, ghost variant) next to the tags input in `NewItemForm` and `ItemEditForm`, hidden when `useHasProAccess()` is false
- Suggested tags show as badges with accept (check) and reject (X) controls; accepting adds the tag to the form's tag list, and nothing is saved until the form is saved
- Toast errors for Pro gating, rate limits and AI failures
- Vitest tests for `generateAutoTags` with `@/lib/ai`, the session and `@/lib/rate-limit` mocked

## Notes

<!-- Any extra notes -->

- Tags are freeform, not limited to existing tags in the database
- Accepted tags are saved through the existing `createItem` / `updateItem` actions; the AI action only suggests
- `GEMINI_API_KEY` is already in `.env` and `.env.example`; it's server-only
- UI gating uses the existing `useHasProAccess()` from `src/components/billing/PlanContext.tsx`; while `ENFORCE_PLANS` isn't `"true"`, everyone sees the button
- `thinkingLevel: MINIMAL` may not be supported by `gemini-3.8-flash`; use `LOW`
- On the free tier, Google may use prompts to improve its products; production should use a billing-enabled project
- Full architecture: `docs/ai-integration-plan.md`

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
- **Homepage:** real `/` marketing page from `src/components/homepage/` sections with content in `src/lib/homepage-content.ts`, tested `src/lib/chaos-physics.ts`, and a shared `Logo` linking home.
- **Fix Cluttered Top Bar on Small Screens:** top bar create buttons collapse to icons below `lg` via a `compact` dialog prop (`src/lib/compact-button.ts`); shortcut badge hidden below `md`.
- **UI Review Fixes:** Playwright review fixes: full-width mobile item drawer, stacked mobile `ItemCard`, homepage `HomeMobileMenu`, `scrollbar-thin`, no autofill in item/collection form fields.
- **Homepage Nav on Auth Pages:** `/sign-in` and `/register` show `HomeNav` (new `page` prop, `/#…` section links via `getSectionLinks`) above `AuthCard` with its `belowNav` option.
- **Stripe Integration Phase 1 - Core Infrastructure:** lazy Stripe client (`src/lib/stripe.ts`), plan gating in `src/lib/usage-limits.ts`, `isPro` on the session via `getSessionUser()`, subscription sync in `src/lib/billing.ts` and `src/lib/db/billing.ts`.
- **Stripe Integration Phase 2 - Integration & UI:** `/api/webhooks/stripe`, Checkout/Portal actions (`src/actions/billing.ts`), Billing section on `/settings` (`src/components/billing/`), free-tier limits on items, collections and uploads.
- **Pro Gate on File & Image Pages:** free users get `ProUpgradePrompt` on `/items/files` and `/items/images`, and disabled File/Image options in the new item type dropdown (`PlanProvider` / `useHasProAccess`).
- **Upgrade Page:** top bar "Upgrade" link for free users to protected `/upgrade` with Free/Pro `UpgradePlans` and monthly/yearly checkout (`useCheckout`); same plans in `ProUpgradePrompt`.
- **Language Dropdown:** `LanguageSelector` Select above the code editor in new/edit item forms; `CODE_LANGUAGES` and `getCodeLanguageLabel` in `src/lib/code-editor.ts` show names like TypeScript.
- **Shared App Layout (Snappier Navigation):** app pages moved into a `src/app/(app)/` route group with one `DashboardShell` layout, so the shell stays mounted and loading skeletons show instantly.
- **Page Skeletons & Cached isPro:** `loading.tsx` skeletons for dashboard, favorites, profile, settings and upgrade; the `jwt` callback's `isPro` read is `getUserIsPro`, wrapped in React `cache()`.
