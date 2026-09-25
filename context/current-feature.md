# Current Feature: Auth Credentials - Email/Password Provider

<!-- Feature name and short description -->

Add a Credentials provider for email/password sign-in, plus a registration API route.

## Status

<!-- Not Started | In Progress | Completed -->

In Progress

## Goals

<!-- Goals and requirements -->

- Hash passwords with `bcryptjs` (already installed)
- Confirm the `password` field exists on the `User` model (it already does — no migration needed)
- Add a Credentials provider placeholder to `src/auth.config.ts` (`authorize: () => null`)
- Override the Credentials provider in `src/auth.ts` with real bcrypt validation
- Create `POST /api/auth/register`:
  - Accept `name`, `email`, `password`, `confirmPassword`
  - Validate that the passwords match
  - Check whether the user already exists
  - Hash the password with bcryptjs
  - Create the user in the database
  - Return a success or error response

## Notes

<!-- Any extra notes -->

- Split pattern: `auth.config.ts` stays edge-safe with a placeholder `authorize`; `auth.ts` replaces it with the bcrypt-backed version.
- Testing:
  1. Register via curl: `curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com","password":"password123","confirmPassword":"password123"}'`
  2. Go to `/api/auth/signin`
  3. Sign in with email/password
  4. Verify redirect to `/dashboard`
  5. Verify GitHub OAuth still works
- Reference: https://authjs.dev/getting-started/authentication/credentials

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial setup:** Next.js 16 app created with Create Next App (React 19, TypeScript, Tailwind CSS v4, ESLint). Boilerplate removed and landing page reduced to a placeholder heading.
- **Dashboard UI Phase 1:** Initialized shadcn/ui (Button, Input) and made dark mode the default. Added the `/dashboard` route with a layout shell: a placeholder sidebar, a top bar with display-only search, New Collection and New Item buttons, and a placeholder main area.
- **Dashboard UI Phase 2:** Built the dashboard sidebar from mock data: item types with icons, colors and counts linking to `/items/[type]`, favorite and recent collections, folding Types and Collections sections, and a user avatar area with a settings link. A top bar toggle collapses the sidebar on desktop and opens it as a shadcn Sheet drawer on mobile. Added the shadcn Sheet and Avatar components.
- **Dashboard UI Phase 3:** Built the dashboard main area from mock data: a page header, four stats cards (items, collections, favorite items, favorite collections), a grid of recent collection cards with type-colored borders and icons, and pinned and 10 most recent item lists using a shared item card with tags and dates. Hid the scrollbars on the sidebar and main area while keeping them scrollable.
- **Prisma + Neon PostgreSQL Setup:** Set up Prisma 7 with a Neon serverless PostgreSQL database: `prisma.config.ts` (dotenv, direct URL for migrations), the `prisma-client` generator outputting to `src/generated/prisma`, and a shared client in `src/lib/db.ts` using the Neon driver adapter. Created the initial schema (Auth.js models plus items, item types, collections and tags, with indexes and cascade deletes) and applied the `init` migration. Added an idempotent seed for the 7 system item types, `db:*` npm scripts, ESM (`"type": "module"`), and a `scripts/test-db.ts` connection test.
- **Seed Data:** Rewrote `prisma/seed.ts` to seed a demo user (`demo@devstash.io`, bcryptjs-hashed password, 12 rounds), the 7 system item types, and 5 collections with 18 items: React Patterns (3 TypeScript snippets), AI Workflows (3 prompts), DevOps (snippet, command and 2 doc links), Terminal Commands (4 commands) and Design Resources (4 links). The seed is idempotent: it upserts the user and system types and recreates the demo user's collections and items. Added `bcryptjs`.
- **Dashboard Collections:** Replaced the mock collection data on the dashboard with data from Neon via Prisma. Added `src/lib/db/collections.ts` (`getRecentCollections`, `getCollectionStats`), `src/lib/db/users.ts` (temporary demo-user lookup until auth exists) and `src/types/collections.ts`. The dashboard page is now an async server component rendered per request; collection cards take their border color from the most-used item type (falling back to the default type) and show icons for all types in the collection, and the Collections and Favorite collections stats come from the database. Items and the sidebar still use mock data.
- **Dashboard Items:** Replaced the mock pinned and recent items and the item stats on the dashboard with data from Neon via Prisma. Added `src/lib/db/items.ts` (`getPinnedItems`, `getRecentItems` ordered by last used with a creation-date fallback, `getItemStats`) and `src/types/items.ts`. Item cards take their icon and border color from the item type and keep tags, pin/favorite markers and dates; the Pinned section is hidden when there are no pinned items. All dashboard queries run in parallel, and the main area no longer uses mock data (the sidebar still does).
- **Stats & Sidebar:** Replaced the sidebar's mock data with data from Neon via Prisma. The dashboard layout fetches the sidebar data per request and passes it through `DashboardShell` to `Sidebar` (the user is reduced to name, email and image so no sensitive fields reach the client). Added `getSidebarItemTypes` to `src/lib/db/items.ts` (system types with the user's item counts) and `getSidebarCollections` to `src/lib/db/collections.ts` (all favorites plus the 5 most recently updated other collections, sharing a `toCollectionSummary` helper with `getRecentCollections`). Favorite collections keep their star, recent collections show a circle colored by their most-used item type (new `ITEM_TYPE_BG_COLORS`), empty groups are hidden, and a "View all collections" link goes to `/collections`. `getDemoUser` is wrapped in React `cache` so the layout and page share one lookup. Added `src/types/sidebar.ts`. The seed now marks 2 pinned items, 4 favorite items and 2 favorite collections. `src/lib/mock-data.ts` is no longer imported.
- **Add Pro Badge to Sidebar:** Added the shadcn/ui Badge component and a subtle, uppercase PRO badge (outline style, muted 10px text) between the type name and item count for Pro-only types in the sidebar (Files and Images). `getSidebarItemTypes` now selects `isProOnly`, added to `SidebarItemType`, so the badge comes from the database flag instead of hard-coded type names.
- **Auth Setup - NextAuth + GitHub Provider:** Added Auth.js (`next-auth@beta`) with `@auth/prisma-adapter` and GitHub OAuth using the split config pattern for edge compatibility: `src/auth.config.ts` (GitHub provider only) and `src/auth.ts` (Prisma adapter on the shared Neon client, JWT sessions, and a session callback that sets `session.user.id` from `token.sub`). Added the `/api/auth/[...nextauth]` route handler, a Next.js 16 proxy in `src/proxy.ts` that guards `/dashboard/:path*` and redirects signed-out users to NextAuth's default sign-in page with a `callbackUrl`, and `src/types/next-auth.d.ts` extending `Session.user` with `id`. The dashboard still reads data for the demo user.
