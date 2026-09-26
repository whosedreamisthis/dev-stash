# Current Feature: Email Verification on Register

<!-- Feature name and short description -->

Require users who register with email and password to verify their email address. After registering, they get an email (sent with Resend) with a verification link they must click before they can sign in with credentials.

## Status

<!-- Not Started | In Progress | Completed -->

In Progress

## Goals

<!-- Goals and requirements -->

- Install the `resend` package and add a small email helper in `src/lib/` that reads `RESEND_API_KEY` from `.env`
- On successful registration (`POST /api/auth/register`), create a verification token (random, expiring, e.g. 24 hours) and email the user a verification link
- Add a verification route (e.g. `/verify-email?token=...`) that checks the token, sets `User.emailVerified`, deletes the token and redirects to `/sign-in` with a success message
- Handle invalid and expired tokens with a clear error message
- Block credentials sign-in for users whose email is not verified, with a user-friendly error on the sign-in page ("Please verify your email…")
- After registering, show a "Check your email" message instead of the current "Account created" banner
- Let users request a new verification email (resend link) from the sign-in page or check-email message
- GitHub OAuth sign-in is unaffected

## Notes

<!-- Any extra notes -->

- The schema already has `User.emailVerified` and the Auth.js `VerificationToken` model (`identifier`, `token`, `expires`), so no migration should be needed. Store a hashed token in the database and send the raw token in the link.
- Build the verification link from the request origin or an app URL env var (e.g. `AUTH_URL` / `NEXT_PUBLIC_APP_URL`) so it works locally and in production.
- Without a verified domain, Resend's test sender (`onboarding@resend.dev`) only delivers to the Resend account owner's email address. Keep the "from" address configurable.
- The seeded demo user (`demo@devstash.io`) should be marked verified in the seed so it can still sign in.
- If sending the email fails, the account should still be created and the user should be able to request a new link.
- Keep the Credentials verification check in `src/auth.ts` (Node runtime), not in the edge-safe `src/auth.config.ts`.

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
- **Auth Credentials - Email/Password Provider:** Added email/password sign-in with the Auth.js Credentials provider in the split config pattern: `src/auth.config.ts` has an edge-safe placeholder (`authorize` returns `null`) and `src/auth.ts` swaps it for a provider that validates input with Zod, looks the user up by email and checks the password with bcryptjs, returning only id, name, email and image. Added `POST /api/auth/register` (name, email, password, confirmPassword), which validates input, returns 409 when the email is taken (including the `P2002` race between the check and the insert), hashes the password with 12 bcrypt rounds and creates the user, using the `{ success, data, error }` response pattern. Shared Zod schemas live in `src/lib/validations/auth.ts` (emails trimmed and lowercased, passwords 8–72 characters). Added `zod` as a direct dependency. The `User.password` column already existed, so no migration was needed. There is no sign-up page yet.
- **Auth UI - Sign In, Register & Sign Out:** Replaced the NextAuth default pages with custom `/sign-in` and `/register` pages, grouped under the `(auth)` route group; `pages.signIn` and the `/dashboard` proxy now point to `/sign-in`. Added server actions in `src/actions/auth.ts` for credentials sign-in (Zod validation, "Invalid email or password" on failure), GitHub sign-in and sign-out, with `callbackUrl` limited to same-site relative paths. The sign-in page has a GitHub button, an email/password form, Auth.js error messages and an "Account created" banner; the register page validates with the shared `registerSchema` (per-field errors), posts to `/api/auth/register`, redirects to `/sign-in?registered=1`, and also offers "Sign up with GitHub". Both pages redirect signed-in users to `/dashboard`. Added shared auth components (`AuthCard`, `FormField`, `SignInForm`, `RegisterForm`, `GitHubAuthForm`), a reusable `UserAvatar` (image or initials), and a sidebar `UserMenu` showing the session user's avatar, name and email with a menu for Profile (`/profile`, not built yet) and Sign out. The sidebar user now comes from the session, while item types and collections still come from the demo user. Added the shadcn dropdown-menu and label components and disabled Next.js dev indicators.
