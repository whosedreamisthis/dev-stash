# Current Feature

<!-- Feature name and short description -->

**Prisma + Neon PostgreSQL Setup** — Set up Prisma 7 ORM with a Neon serverless PostgreSQL database and create the initial schema.

## Status

<!-- Not Started | In Progress | Completed -->

In Progress

## Goals

<!-- Goals and requirements -->

- Use Neon PostgreSQL (serverless)
- Create the initial schema based on the data models in `context/project-overview.md` (this will evolve)
- Include the NextAuth models (Account, Session, VerificationToken)
- Add appropriate indexes and cascade deletes

## Notes

<!-- Any extra notes -->

- Use Prisma 7, which has breaking changes. Read the upgrade guide before starting: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- Setup guide: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres
- `DATABASE_URL` points to the Neon development branch; there is a separate production branch.
- Always create migrations (`prisma migrate dev`). Never use `prisma db push` unless explicitly asked.
- References: `context/project-overview.md` (data models), `context/coding-standards.md` (database standards).

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial setup:** Next.js 16 app created with Create Next App (React 19, TypeScript, Tailwind CSS v4, ESLint). Boilerplate removed and landing page reduced to a placeholder heading.
- **Dashboard UI Phase 1:** Initialized shadcn/ui (Button, Input) and made dark mode the default. Added the `/dashboard` route with a layout shell: a placeholder sidebar, a top bar with display-only search, New Collection and New Item buttons, and a placeholder main area.
- **Dashboard UI Phase 2:** Built the dashboard sidebar from mock data: item types with icons, colors and counts linking to `/items/[type]`, favorite and recent collections, folding Types and Collections sections, and a user avatar area with a settings link. A top bar toggle collapses the sidebar on desktop and opens it as a shadcn Sheet drawer on mobile. Added the shadcn Sheet and Avatar components.
- **Dashboard UI Phase 3:** Built the dashboard main area from mock data: a page header, four stats cards (items, collections, favorite items, favorite collections), a grid of recent collection cards with type-colored borders and icons, and pinned and 10 most recent item lists using a shared item card with tags and dates. Hid the scrollbars on the sidebar and main area while keeping them scrollable.
