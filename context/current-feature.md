# Current Feature

<!-- Feature name and short description -->

## Status

<!-- Not Started | In Progress | Completed -->

Completed

## Goals

<!-- Goals and requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial setup:** Next.js 16 app created with Create Next App (React 19, TypeScript, Tailwind CSS v4, ESLint). Boilerplate removed and landing page reduced to a placeholder heading.
- **Dashboard UI Phase 1:** Initialized shadcn/ui (Button, Input) and made dark mode the default. Added the `/dashboard` route with a layout shell: a placeholder sidebar, a top bar with display-only search, New Collection and New Item buttons, and a placeholder main area.
- **Dashboard UI Phase 2:** Built the dashboard sidebar from mock data: item types with icons, colors and counts linking to `/items/[type]`, favorite and recent collections, folding Types and Collections sections, and a user avatar area with a settings link. A top bar toggle collapses the sidebar on desktop and opens it as a shadcn Sheet drawer on mobile. Added the shadcn Sheet and Avatar components.
- **Dashboard UI Phase 3:** Built the dashboard main area from mock data: a page header, four stats cards (items, collections, favorite items, favorite collections), a grid of recent collection cards with type-colored borders and icons, and pinned and 10 most recent item lists using a shared item card with tags and dates. Hid the scrollbars on the sidebar and main area while keeping them scrollable.
- **Prisma + Neon PostgreSQL Setup:** Set up Prisma 7 with a Neon serverless PostgreSQL database: `prisma.config.ts` (dotenv, direct URL for migrations), the `prisma-client` generator outputting to `src/generated/prisma`, and a shared client in `src/lib/db.ts` using the Neon driver adapter. Created the initial schema (Auth.js models plus items, item types, collections and tags, with indexes and cascade deletes) and applied the `init` migration. Added an idempotent seed for the 7 system item types, `db:*` npm scripts, ESM (`"type": "module"`), and a `scripts/test-db.ts` connection test.
- **Seed Data:** Rewrote `prisma/seed.ts` to seed a demo user (`demo@devstash.io`, bcryptjs-hashed password, 12 rounds), the 7 system item types, and 5 collections with 18 items: React Patterns (3 TypeScript snippets), AI Workflows (3 prompts), DevOps (snippet, command and 2 doc links), Terminal Commands (4 commands) and Design Resources (4 links). The seed is idempotent: it upserts the user and system types and recreates the demo user's collections and items. Added `bcryptjs`.
- **Dashboard Collections:** Replaced the mock collection data on the dashboard with data from Neon via Prisma. Added `src/lib/db/collections.ts` (`getRecentCollections`, `getCollectionStats`), `src/lib/db/users.ts` (temporary demo-user lookup until auth exists) and `src/types/collections.ts`. The dashboard page is now an async server component rendered per request; collection cards take their border color from the most-used item type (falling back to the default type) and show icons for all types in the collection, and the Collections and Favorite collections stats come from the database. Items and the sidebar still use mock data.
