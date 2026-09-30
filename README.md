# DevStash

**A fast, searchable, AI-enhanced hub for developer knowledge.**

**Live demo: [dev-stash-nu.vercel.app](https://dev-stash-nu.vercel.app/)**

Developers keep snippets in VS Code, prompts in old chat threads, commands in bash history and links in a hundred bookmarks. DevStash brings all of it into one place: code snippets, AI prompts, terminal commands, notes, links, files and images, organized into collections and searchable from anywhere with <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd>.

## Try the Demo

No sign-up needed. Open [dev-stash-nu.vercel.app](https://dev-stash-nu.vercel.app/) and click **Try the Demo** to get your own temporary Pro account, filled with sample collections and items.

- Every Pro feature is unlocked, including AI tagging and descriptions, and file and image uploads.
- The account is yours alone, so create, edit and delete freely. Nothing you do affects other visitors.
- Demo accounts and their data are deleted automatically after 24 hours.

## Features

- **Seven item types:** snippets, prompts, commands, notes, links, files and images, each with its own color and icon
- **Collections:** group items of any type; an item can belong to several collections
- **Editors:** Monaco code editor with language selection for snippets and commands, and a Markdown editor with preview for notes and prompts
- **Command palette:** <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> searches items and collections by title, tags, type, language and content
- **Favorites and pins:** favorite items and collections, pin items to the top of every list
- **File and image uploads (Pro):** uploads with server-side type and size checks; downloads go through an authenticated proxy
- **AI features (Pro):** tag suggestions and one-click descriptions, powered by Google Gemini
- **Plans and billing:** free and Pro plans with Stripe Checkout, the customer portal and webhook-driven subscription sync
- **Accounts:** email and password or GitHub sign-in, email verification, password reset, and rate limiting on every auth flow
- **Settings:** editor preferences (font size, tab size, word wrap, minimap, theme), change password and delete account
- **Responsive, dark-first UI** built with shadcn/ui

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions) and React 19 |
| Language | TypeScript (strict) |
| Database | Neon serverless PostgreSQL with Prisma 7 and the Neon driver adapter |
| Auth | Auth.js (NextAuth v5): credentials, GitHub OAuth and a demo provider; JWT sessions |
| Styling | Tailwind CSS v4 and shadcn/ui, with Lucide icons |
| File storage | UploadThing |
| AI | Google Gemini via `@google/genai` |
| Payments | Stripe |
| Email | Resend |
| Rate limiting | Upstash Redis |
| Testing | Vitest |

## Engineering Highlights

- **Every query is scoped to the signed-in user.** Server actions never trust client-supplied ownership, and all input is validated with Zod.
- **Plan limits are enforced on the server.** Pro checks live in one place, `src/lib/usage-limits.ts`, and run in the actions, the upload route and the AI calls, not just the UI.
- **Uploads are verified end to end.** After an upload, the server signs the file's details. Item creation checks that signature, so the browser can't swap files. Downloads are served as attachments with a restrictive security policy.
- **Isolated demo sandboxes.** Each demo visitor gets a separate account seeded in one database transaction. Expired accounts and their uploaded files are cleaned up after the response, so sign-in isn't slowed down.
- **Security review.** Auth flows use hashed single-use tokens, per-IP and per-email rate limits, same-origin-only redirects, and responses that don't reveal which emails have accounts.
- **Tested.** More than 450 Vitest unit tests cover server actions and utilities, with the database and external services mocked.

## Getting Started

### Prerequisites

- Node.js 20 or later
- A PostgreSQL database (the project uses [Neon](https://neon.com))
- Accounts for the services you want to enable: GitHub OAuth, UploadThing, Stripe, Resend, Upstash and Gemini. The core app runs without most of them.

### Setup

```bash
git clone https://github.com/whosedreamisthis/dev-stash.git
cd dev-stash
npm install          # also generates the Prisma client
cp .env.example .env # then fill in the values (see below)
npx prisma migrate dev
npm run db:seed      # system item types and the demo@devstash.io user
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). After seeding, you can sign in as `demo@devstash.io` with the password `12345678`, or click **Try the Demo**.

> After changing `prisma/schema.prisma` and running a migration, also run `npm run db:generate`. Prisma 7's `migrate dev` doesn't regenerate the client.

### Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled connection string, used by the app |
| `DATABASE_URL_UNPOOLED` | Direct connection string, used by the Prisma CLI and migrations |
| `AUTH_SECRET` | Auth.js secret (`npx auth secret` generates one) |
| `AUTH_URL` | Public app URL for email links; required in production |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub OAuth app |
| `RESEND_API_KEY`, `EMAIL_FROM` | Verification and password reset emails |
| `EMAIL_VERIFICATION_ENABLED` | `false` turns email verification off (on by default) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting; limits are skipped when unset |
| `UPLOADTHING_TOKEN` | File and image uploads |
| `GEMINI_API_KEY` | AI features |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe billing |
| `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` | Stripe price IDs for the Pro plans |
| `ENFORCE_PLANS` | `true` turns on free-tier limits; otherwise everyone gets Pro features |
| `DEMO_ONLY_MODE` | `true` turns off regular sign-in and registration so only **Try the Demo** works |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build, including the TypeScript check |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy` | Apply existing migrations (production) |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:seed` | Seed system item types and the local demo user |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
prisma/              schema, migrations and seed
src/
  actions/           server actions (items, collections, auth, billing, AI, search)
  app/               routes: marketing homepage, auth pages, (app) dashboard pages, API routes
  components/        UI grouped by feature, plus shadcn/ui primitives in components/ui
  hooks/             client hooks
  lib/               utilities, validation schemas and database queries (lib/db)
  types/             shared TypeScript types
  auth.ts            Auth.js configuration
  proxy.ts           route protection
```

API routes exist only where a real URL is needed: Auth.js and UploadThing callbacks, the Stripe webhook and the file download proxy. Everything else goes through server actions.

## Deployment

1. Set the environment variables on your host, including `AUTH_URL`. Set `DEMO_ONLY_MODE=true` if the site should only offer the demo.
2. Run `npm run db:deploy` against the production database before starting the new build.
3. Point a Stripe webhook at `/api/webhooks/stripe`. It needs the `checkout.session.completed` and `customer.subscription.*` events.
