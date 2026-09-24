# Current Feature

<!-- Feature name and short description -->

**Dashboard UI Phase 3** — Build the dashboard main area (phase 3 of 3), using mock data imported directly from `src/lib/mock-data.ts` until the database is implemented.

## Status

<!-- Not Started | In Progress | Completed -->

In Progress

## Goals

<!-- Goals and requirements -->

- The main area to the right of the sidebar
- Recent collections
- Pinned items
- 10 recent items
- 4 stats cards at the top: number of items, collections, favorite items and favorite collections (not in the screenshot)

## Notes

<!-- Any extra notes -->

- Match the layout in `context/screenshots/dashboard-ui-main.png`.
- Import mock data directly from `src/lib/mock-data.ts` for now (the spec says `mock-data.js`, but the file is TypeScript).
- References: `context/project-overview.md`, `context/features/dashboard-phase-1-spec.md`, `context/features/dashboard-phase-2-spec.md`.

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial setup:** Next.js 16 app created with Create Next App (React 19, TypeScript, Tailwind CSS v4, ESLint). Boilerplate removed and landing page reduced to a placeholder heading.
- **Dashboard UI Phase 1:** Initialized shadcn/ui (Button, Input) and made dark mode the default. Added the `/dashboard` route with a layout shell: a placeholder sidebar, a top bar with display-only search, New Collection and New Item buttons, and a placeholder main area.
- **Dashboard UI Phase 2:** Built the dashboard sidebar from mock data: item types with icons, colors and counts linking to `/items/[type]`, favorite and recent collections, folding Types and Collections sections, and a user avatar area with a settings link. A top bar toggle collapses the sidebar on desktop and opens it as a shadcn Sheet drawer on mobile. Added the shadcn Sheet and Avatar components.
