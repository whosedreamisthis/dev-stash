# Stripe Integration Plan — DevStash Pro

Plan for adding Stripe subscriptions to DevStash: **Pro at $8/month or $72/year**. It is based on the current codebase (September 2026) and the current Stripe API (`2025-03-31.basil` and later).

---

## Contents

1. [Current State](#1-current-state)
2. [Feature Gating Analysis](#2-feature-gating-analysis)
3. [API, Action & Env Patterns](#3-api-action--env-patterns)
4. [Design Decisions](#4-design-decisions)
5. [Files to Create](#5-files-to-create)
6. [Files to Modify](#6-files-to-modify)
7. [Stripe Dashboard Setup](#7-stripe-dashboard-setup)
8. [Testing Checklist](#8-testing-checklist)
9. [Implementation Order](#9-implementation-order)
10. [Open Questions](#10-open-questions)

---

## 1. Current State

### User model ([prisma/schema.prisma](../prisma/schema.prisma))

The billing fields already exist, so **no migration is needed**:

```prisma
isPro                  Boolean   @default(false)
stripeCustomerId       String?   @unique
stripeSubscriptionId   String?   @unique
stripeCurrentPeriodEnd DateTime?
```

Nothing reads or writes these fields yet. A grep for `isPro`, `stripe`, `hasProAccess`, `ENFORCE_PLANS` and `FREE_LIMITS` in `src/` finds only `ItemType.isProOnly`, which drives the sidebar's PRO badge ([SidebarTypeLink.tsx](../src/components/dashboard/SidebarTypeLink.tsx)).

### Auth (NextAuth v5)

| File | Role |
| --- | --- |
| [src/auth.config.ts](../src/auth.config.ts) | Edge-safe config (GitHub + stub Credentials), used by the proxy |
| [src/auth.ts](../src/auth.ts) | Full config: Prisma adapter, real Credentials `authorize`, `session: { strategy: "jwt" }` |
| [src/proxy.ts](../src/proxy.ts) | Route guard for `/dashboard`, `/profile`, `/settings`, `/items`, `/collections`, `/favorites`; it only checks that `req.auth` exists |
| [src/types/next-auth.d.ts](../src/types/next-auth.d.ts) | Adds `session.user.id` |

- Sessions are **JWTs**. `auth.ts` has only a `session` callback that copies `token.sub` into `session.user.id`. There is no `jwt` callback yet.
- The proxy builds its own `NextAuth(authConfig)`, so callbacks defined only in `auth.ts` don't run there. That's fine because the proxy doesn't need `isPro`, and it keeps Prisma out of the edge bundle.

### How user data is accessed

- **Server actions:** `getSessionUserId()` from [src/lib/session.ts](../src/lib/session.ts), then return `{ success: false, error: NOT_SIGNED_IN_ERROR }` when it's null.
- **Server components/pages:** `await auth()` directly (e.g. [settings/page.tsx](../src/app/settings/page.tsx)), followed by a DB read such as `getProfileUser(userId)`.
- **Sidebar/layout:** `getSidebarData()` in [src/lib/db/sidebar.ts](../src/lib/db/sidebar.ts) reads `session.user` for name, email and image.
- **Queries** live in `src/lib/db/*.ts` and always take `userId` as their first argument.

### Existing payment code

There is none: no `stripe` dependency, no webhook route and no billing page. `/settings/billing` and `/api/webhooks/stripe` are listed in the spec's route table but haven't been built.

---

## 2. Feature Gating Analysis

### Limits (from the project spec)

| | Free | Pro |
| --- | --- | --- |
| Items | 50 | Unlimited |
| Collections | 3 | Unlimited |
| File & Image types | ❌ | ✅ |
| AI features, export, custom types | ❌ | ✅ (not built yet) |

The spec says: *build the gating now, but let everyone use everything during development*, centralized in `src/lib/plan.ts` behind `ENFORCE_PLANS`.

### Where the checks go

| Check | Location | Current code |
| --- | --- | --- |
| Item limit (50) | `createItem` in [src/actions/items.ts](../src/actions/items.ts) | No limit. `getItemStats(userId).total` in [src/lib/db/items.ts](../src/lib/db/items.ts) already counts items |
| Collection limit (3) | `createCollection` in [src/actions/collections.ts](../src/actions/collections.ts) | No limit and no count query yet |
| File/Image items | `createItem` action | `isUploadTypeSlug()` ([upload-constraints.ts](../src/lib/upload-constraints.ts)) already identifies the two upload types, which are the only `isProOnly` types |
| File/Image uploads | `uploadMiddleware` in [src/lib/uploadthing.ts](../src/lib/uploadthing.ts) | Checks auth and size/extension only. This is the most important gate: it stops the file from being stored at all |
| File downloads | [src/app/api/items/[id]/file/route.ts](../src/app/api/items/[id]/file/route.ts) | **Leave ungated.** Downgraded users keep read access to what they uploaded |
| AI / export / custom types | Not built | Future features call `hasProAccess()` in their actions |

Updates, deletes, favorites and pins stay open to everyone, so a user who downgrades with more than 50 items can still manage them but can't create more.

### Settings page structure

[src/app/settings/page.tsx](../src/app/settings/page.tsx) is a server component inside [settings/layout.tsx](../src/app/settings/layout.tsx) (a `DashboardShell` with the sidebar, rendered per request via `connection()`). It stacks sections: `EditorPreferencesSection`, then `AccountActions` (rounded `bg-card` rows with a title, a description and an action on the right). `/settings/billing` fits as a sibling page under the same layout, and the proxy already covers `/settings/:path*`.

---

## 3. API, Action & Env Patterns

### API routes

Only endpoints that need a real URL are routes: `api/auth/[...nextauth]`, `api/uploadthing`, `api/items/[id]/file`. The Stripe webhook belongs in this group. Everything the app's own UI calls is a server action ([project overview §8](../context/project-overview.md#8-routes)). Checkout and portal sessions are therefore **server actions that return a URL**, not API routes.

### Server action shape

Every action follows the same steps:

```ts
const userId = await getSessionUserId();
if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

const parsed = schema.safeParse(input);
if (!parsed.success) return { success: false, error: "..." };

try {
  // query
  return { success: true, data };
} catch (error) {
  console.error("Doing X failed:", error);
  return { success: false, error: "Something went wrong. Please try again." };
}
```

The client shows `error` in a Sonner toast. Tests mock `@/auth` and `@/lib/...` with `vi.mock` (see [profile.test.ts](../src/actions/profile.test.ts)).

### Environment variables

- They're read directly via `process.env.X`, with no central env module.
- Optional services are **created lazily and degrade gracefully**. [rate-limit.ts](../src/lib/rate-limit.ts) builds the Redis client on first use "so a missing config doesn't break imports or the build". The Stripe client should work the same way.
- `getAppUrl()` in [src/lib/tokens.ts](../src/lib/tokens.ts) returns `AUTH_URL` (required in production) and is reused for Checkout's success, cancel and return URLs.
- Toggles are string compares: `EMAIL_VERIFICATION_ENABLED === "false"`.

New variables:

```bash
STRIPE_SECRET_KEY=         # sk_test_… / sk_live_…
STRIPE_WEBHOOK_SECRET=     # whsec_… (a different value from `stripe listen` locally)
STRIPE_PRICE_MONTHLY=      # price_… ($8/month)
STRIPE_PRICE_YEARLY=       # price_… ($72/year)
ENFORCE_PLANS=             # "true" turns on free-tier limits; anything else = everyone is Pro
```

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (in the spec's env list) **isn't needed**: hosted Checkout is a plain redirect, so Stripe.js never loads. Leave it out until embedded Checkout or Elements is used.

---

## 4. Design Decisions

| Decision | Why |
| --- | --- |
| **Hosted Checkout + Customer Portal** | No card UI to build or secure; the portal handles cancel, plan switching, payment methods and invoices |
| **Create the Stripe customer before Checkout** and save `stripeCustomerId` | Every later webhook finds the user by customer ID; stops duplicate customers when a user checks out twice |
| **Webhooks are the source of truth**, plus a sync on the success page | The success page's `?session_id=` sync makes Pro show up on the next render even if the webhook is a few seconds late; both paths call the same idempotent function |
| **Handlers re-fetch the subscription from Stripe** instead of trusting the event payload | Webhooks can arrive out of order or be retried; fetching the current state makes every handler idempotent |
| **`isPro` = status `active` or `trialing`** | `past_due`, `unpaid`, `canceled` and `incomplete*` lose Pro. Stripe's retry schedule decides when a failing card finally cancels |
| **Period end from `subscription.items.data[0].current_period_end`** | Since API `2025-03-31.basil`, `current_period_end` is no longer on the Subscription itself |
| **JWT callback re-reads `isPro` on every session check** (see the research note) | `update()` / `trigger === "update"` doesn't pick up changes made by a webhook; one indexed primary-key query per `auth()` call is cheap |
| **Server-side checks read `session.user.isPro`** | It comes fresh from the DB via the JWT callback, so actions don't need a second query |
| **`ENFORCE_PLANS` is read at call time** (not at module load as in the spec's snippet) | Lets tests switch it with `vi.stubEnv`; behavior is otherwise identical |
| **Cancel the subscription when the account is deleted** | Otherwise a deleted user keeps being charged |
| **Don't pin `apiVersion`** | The `stripe` package pins the API version it was built for, which keeps its TypeScript types correct |

---

## 5. Files to Create

### 5.1 `src/lib/stripe.ts` — lazy client

```ts
import Stripe from "stripe";

let stripe: Stripe | undefined;

// Created on first use so a missing key doesn't break imports or the build
export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripe = new Stripe(key);
  }
  return stripe;
}

export type BillingInterval = "monthly" | "yearly";

export function getPriceId(interval: BillingInterval): string {
  const priceId =
    interval === "monthly" ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_YEARLY;
  if (!priceId) throw new Error(`Stripe price for the ${interval} plan is not set`);
  return priceId;
}
```

### 5.2 `src/lib/plan.ts` — central gating

```ts
export const FREE_LIMITS = { items: 50, collections: 3 } as const;

export const PRO_REQUIRED_ERROR = "This feature requires DevStash Pro.";
export const ITEM_LIMIT_ERROR = `Free accounts can have up to ${FREE_LIMITS.items} items. Upgrade to Pro for unlimited items.`;
export const COLLECTION_LIMIT_ERROR = `Free accounts can have up to ${FREE_LIMITS.collections} collections. Upgrade to Pro for unlimited collections.`;

// Read on each call so tests can switch it with vi.stubEnv
function isPlanEnforced() {
  return process.env.ENFORCE_PLANS === "true";
}

// Everyone is Pro until ENFORCE_PLANS is "true"
export function hasProAccess(user: { isPro: boolean }): boolean {
  if (!isPlanEnforced()) return true;
  return user.isPro;
}

export function isAtLimit(user: { isPro: boolean }, count: number, limit: number): boolean {
  return !hasProAccess(user) && count >= limit;
}
```

### 5.3 `src/lib/db/billing.ts` — billing queries and subscription sync

```ts
import type Stripe from "stripe";
import { prisma } from "@/lib/db";

const PRO_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing"]);

export interface BillingUser {
  email: string | null;
  name: string | null;
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCurrentPeriodEnd: Date | null;
}

export function getBillingUser(userId: string): Promise<BillingUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
    },
  });
}

export async function setStripeCustomerId(userId: string, customerId: string) {
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
}

// Idempotent: writes the subscription's current state to the user who owns its customer.
// A stale event for an old subscription can't clear a newer one, because losing Pro
// only applies to the subscription that's stored.
export async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  // Moved from the subscription to its items in API 2025-03-31.basil
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const stripeCurrentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;

  if (PRO_STATUSES.has(subscription.status)) {
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { isPro: true, stripeSubscriptionId: subscription.id, stripeCurrentPeriodEnd },
    });
    return;
  }

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId, stripeSubscriptionId: subscription.id },
    data: { isPro: false, stripeSubscriptionId: null, stripeCurrentPeriodEnd: null },
  });
}

export function countCollections(userId: string): Promise<number> {
  return prisma.collection.count({ where: { userId } });
}
```

> `countCollections` could go in `src/lib/db/collections.ts` instead; put it wherever fits the existing files better.

### 5.4 `src/lib/billing.ts` — Stripe-side logic shared by actions, the webhook and the success page

```ts
import type Stripe from "stripe";
import { getBillingUser, setStripeCustomerId, syncSubscription } from "@/lib/db/billing";
import { getStripe } from "@/lib/stripe";

// Returns the user's Stripe customer, creating and saving one on first checkout.
// The idempotency key stops a double click from creating two customers.
export async function getOrCreateCustomerId(userId: string): Promise<string | null> {
  const user = await getBillingUser(userId);
  if (!user) return null;
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await getStripe().customers.create(
    {
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { userId },
    },
    { idempotencyKey: `customer-${userId}` },
  );
  await setStripeCustomerId(userId, customer.id);
  return customer.id;
}

// Always re-fetches, so retried or out-of-order events apply the current state
export async function syncSubscriptionById(subscriptionId: string) {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await syncSubscription(subscription);
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription" || !session.subscription) return;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      await syncSubscriptionById(subscriptionId);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscriptionById(event.data.object.id);
      return;
    default:
      return;
  }
}

// Called by the billing page on return from Checkout, so Pro shows immediately even
// when the webhook hasn't arrived yet. The session must belong to the signed-in user.
export async function syncCheckoutSession(userId: string, sessionId: string): Promise<void> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== userId || session.status !== "complete") return;
  if (typeof session.subscription === "string") await syncSubscriptionById(session.subscription);
}
```

### 5.5 `src/actions/billing.ts` — Checkout and Portal actions

```ts
"use server";

import { z } from "zod";
import { getBillingUser } from "@/lib/db/billing";
import { getOrCreateCustomerId } from "@/lib/billing";
import { getSessionUserId, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import { getPriceId, getStripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/tokens";

const intervalSchema = z.enum(["monthly", "yearly"]);

export interface BillingRedirectResult {
  success: boolean;
  data?: { url: string };
  error?: string;
}

export async function createCheckoutSession(interval: string): Promise<BillingRedirectResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = intervalSchema.safeParse(interval);
  if (!parsed.success) return { success: false, error: "Please choose a plan." };

  try {
    const user = await getBillingUser(userId);
    if (!user) return { success: false, error: NOT_SIGNED_IN_ERROR };
    // Plan changes go through the portal so nobody ends up with two subscriptions
    if (user.stripeSubscriptionId) {
      return { success: false, error: "You already have Pro. Manage it from Billing." };
    }

    const customerId = await getOrCreateCustomerId(userId);
    if (!customerId) return { success: false, error: NOT_SIGNED_IN_ERROR };

    const appUrl = await getAppUrl();
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: userId,
      line_items: [{ price: getPriceId(parsed.data), quantity: 1 }],
      subscription_data: { metadata: { userId } },
      success_url: `${appUrl}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings/billing?checkout=canceled`,
    });
    if (!session.url) throw new Error("Checkout session has no URL");
    return { success: true, data: { url: session.url } };
  } catch (error) {
    console.error("Creating checkout session failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function createPortalSession(): Promise<BillingRedirectResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  try {
    const user = await getBillingUser(userId);
    if (!user?.stripeCustomerId) return { success: false, error: "No billing account found." };

    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${await getAppUrl()}/settings/billing`,
    });
    return { success: true, data: { url: session.url } };
  } catch (error) {
    console.error("Creating portal session failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
```

The client calls the action, shows `error` in a toast, or runs `window.location.assign(result.data.url)`.

### 5.6 `src/app/api/webhooks/stripe/route.ts`

```ts
import type Stripe from "stripe";
import { handleStripeEvent } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

// Signature checks need the raw body exactly as Stripe sent it, so it's read as text
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response("Missing signature", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature check failed:", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (error) {
    // A 500 makes Stripe retry the event later
    console.error(`Stripe webhook ${event.type} failed:`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}
```

- The proxy matcher doesn't include `/api`, so Stripe can reach this route without a session.
- Route handlers run in the Node.js runtime by default, which the `stripe` package needs.

### 5.7 `src/app/settings/billing/page.tsx`

A server component under the existing settings layout:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BillingPlanCard } from "@/components/billing/BillingPlanCard";
import { syncCheckoutSession } from "@/lib/billing";
import { countCollections, getBillingUser } from "@/lib/db/billing";
import { getItemStats } from "@/lib/db/items";
import { FREE_LIMITS } from "@/lib/plan";

export default async function BillingPage({ searchParams }: PageProps<"/settings/billing">) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in?callbackUrl=/settings/billing");

  const { session_id: sessionId } = await searchParams;
  if (typeof sessionId === "string") {
    // Best effort: the webhook applies the same change if this fails
    await syncCheckoutSession(userId, sessionId).catch((error) =>
      console.error("Syncing checkout session failed:", error),
    );
  }

  const [user, itemStats, collectionCount] = await Promise.all([
    getBillingUser(userId),
    getItemStats(userId),
    countCollections(userId),
  ]);
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-muted-foreground">Your plan and usage</p>
      </header>
      <BillingPlanCard
        isPro={user.isPro}
        periodEnd={user.stripeCurrentPeriodEnd}
        hasCustomer={user.stripeCustomerId !== null}
        usage={{ items: itemStats.total, collections: collectionCount }}
        limits={FREE_LIMITS}
      />
    </div>
  );
}
```

> A successful checkout redirects here with `session_id`. After syncing, `redirect("/settings/billing?checkout=success")` so a refresh doesn't sync again and the client can show a one-time "Welcome to Pro" toast.

### 5.8 `src/components/billing/`

| Component | Type | Job |
| --- | --- | --- |
| `BillingPlanCard.tsx` | Server | Current plan (Free / Pro), renewal date (`periodEnd`), usage bars (`items / 50`, `collections / 3`, hidden for Pro), and either `UpgradeButtons` or `ManageBillingButton` |
| `UpgradeButtons.tsx` | Client | Two buttons: "$8 / month" and "$72 / year — save 25%". Each calls `createCheckoutSession(interval)`, shows a pending state, toasts the error or redirects |
| `ManageBillingButton.tsx` | Client | Calls `createPortalSession()`, toasts the error or redirects |
| `CheckoutToast.tsx` | Client | Reads `?checkout=success|canceled` once and shows a Sonner toast |

Style them like the `AccountActions` rows (`rounded-xl border bg-card p-5`) with shadcn `Button`.

### 5.9 Tests (next to the code, per coding standards)

| File | What it covers |
| --- | --- |
| `src/lib/plan.test.ts` | `hasProAccess` with `ENFORCE_PLANS` unset / `"true"`; `isAtLimit` below, at and above the limit, and for Pro |
| `src/lib/db/billing.test.ts` | `syncSubscription`: active and trialing set Pro plus the period end from `items.data[0]`; canceled and past_due clear it only for the matching subscription ID; expanded `customer` objects |
| `src/lib/billing.test.ts` | `handleStripeEvent` routes each event type to a re-fetch and ignores others and non-subscription checkouts; `syncCheckoutSession` ignores other users' sessions and incomplete sessions; `getOrCreateCustomerId` reuses an existing customer |
| `src/actions/billing.test.ts` | No session, invalid interval, already subscribed, happy path returns the URL with the right price / `client_reference_id`, Stripe failure returns the generic error; portal without a customer |
| `src/app/api/webhooks/stripe/route.test.ts` | Missing signature → 400, bad signature → 400, handler throws → 500, success → 200 (mock `@/lib/stripe` and `@/lib/billing`, following the existing `api/items/[id]/file/route.test.ts`) |
| Update `src/actions/items.test.ts`, `collections.test.ts`, `src/lib/uploadthing.test.ts` | Limits and Pro checks with `vi.stubEnv("ENFORCE_PLANS", "true")`, and still no limits when it's unset |

---

## 6. Files to Modify

### 6.1 `package.json`

```bash
npm install stripe
```

### 6.2 `src/types/next-auth.d.ts` — add `isPro`

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isPro?: boolean;
  }
}
```

### 6.3 `src/auth.ts` — sync `isPro` on every session check

Add a `jwt` callback (the workaround from the research note) and expose `isPro` on the session. It must live in `auth.ts`, **not** `auth.config.ts`, because it uses Prisma and `auth.config.ts` is bundled into the edge proxy.

```ts
callbacks: {
  async jwt({ token, user }) {
    if (user?.id) token.sub = user.id;

    // Always re-read isPro so Stripe webhook changes show up without calling update()
    if (token.sub) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { isPro: true },
      });
      token.isPro = dbUser?.isPro ?? false;
    }

    return token;
  },
  session({ session, token }) {
    if (token.sub) session.user.id = token.sub;
    session.user.isPro = token.isPro ?? false;
    return session;
  },
},
```

Cost: one primary-key lookup per `auth()` call. A page render calls `auth()` a few times (layout sidebar, page, actions), which is acceptable. If it shows up in profiling, wrap the lookup in React's `cache()`.

### 6.4 `src/lib/session.ts` — add a helper that includes the plan

```ts
export interface SessionUser {
  id: string;
  isPro: boolean;
}

// The signed-in user with their plan (synced from the database on each check)
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  return id ? { id, isPro: session.user.isPro ?? false } : null;
}
```

Keep `getSessionUserId()` as is. Only the gated actions switch to `getSessionUser()`.

### 6.5 `src/actions/items.ts` — `createItem` gating

After Zod validation and before the upload check:

```ts
const user = await getSessionUser();
if (!user) return { success: false, error: NOT_SIGNED_IN_ERROR };
// …parse…

// The upload types (File, Image) are the Pro-only types
if (isUploadTypeSlug(parsed.data.typeSlug) && !hasProAccess(user)) {
  return { success: false, error: PRO_REQUIRED_ERROR };
}

try {
  const { total } = await getItemStats(user.id);
  if (isAtLimit(user, total, FREE_LIMITS.items)) {
    return { success: false, error: ITEM_LIMIT_ERROR };
  }
  // …existing createItemQuery…
```

- Once custom types exist, switch the Pro-type check to reading `ItemType.isProOnly` from the database instead of `isUploadTypeSlug`.
- Two simultaneous creates can land on item 51. That's acceptable for a soft limit; don't add locking.

### 6.6 `src/actions/collections.ts` — `createCollection` gating

```ts
const user = await getSessionUser();
if (!user) return { success: false, error: NOT_SIGNED_IN_ERROR };
// …parse…
try {
  const count = await countCollections(user.id);
  if (isAtLimit(user, count, FREE_LIMITS.collections)) {
    return { success: false, error: COLLECTION_LIMIT_ERROR };
  }
  // …existing createCollectionQuery…
```

### 6.7 `src/lib/uploadthing.ts` — block uploads for free users

In `uploadMiddleware`, after the session check:

```ts
const session = await auth();
const userId = session?.user?.id;
if (!userId) throw new UploadThingError("You must be signed in to upload files.");
if (!hasProAccess({ isPro: session.user.isPro })) {
  throw new UploadThingError("File and image uploads require DevStash Pro.");
}
```

### 6.8 `src/lib/account.ts` — cancel the subscription before deleting the account

```ts
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { email: true, stripeSubscriptionId: true },
});
if (!user) return;

// Cancelled first so a deleted account is never billed again. If this throws, the
// account is kept and the action shows its generic error.
if (user.stripeSubscriptionId) {
  await getStripe().subscriptions.cancel(user.stripeSubscriptionId);
}
```

The `customer.subscription.deleted` webhook that follows finds no user and does nothing. Update `profile.test.ts`, or add a test for `account.ts`, to cover this.

### 6.9 `src/app/settings/page.tsx` — link to billing

Add a "Plan" row above `AccountActions`, styled like the other rows: shows "Free" or "Pro" and links to `/settings/billing`. The page already loads the user; add `isPro` to what it reads (or use `session.user.isPro`).

### 6.10 `src/components/dashboard/UserMenu.tsx` — Billing entry

Add a "Billing" item (Lucide `CreditCard`) linking to `/settings/billing`, between Settings and Sign out.

### 6.11 Env files and docs

- Add the five variables from §3 to `.env` (test keys) and to the production environment (live keys).
- Update the environment variable block in `context/project-overview.md` to add `ENFORCE_PLANS` and mark `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` as unused for now.

---

## 7. Stripe Dashboard Setup

Do everything in **test mode** (sandbox) first.

1. **Product and prices** — *Product catalog → Add product*
   - Name: `DevStash Pro`
   - Price 1: recurring, **$8.00 USD / month** → copy the `price_…` ID into `STRIPE_PRICE_MONTHLY`
   - Price 2: recurring, **$72.00 USD / year** → copy into `STRIPE_PRICE_YEARLY`
2. **API key** — *Developers → API keys* → copy the secret key into `STRIPE_SECRET_KEY`.
3. **Customer Portal** — *Settings → Billing → Customer portal*
   - Enable: update payment methods, view invoice history, cancel subscriptions (**at end of billing period**).
   - Enable plan switching between the two DevStash Pro prices.
   - Default return URL: `https://<your-domain>/settings/billing`.
   - Save. The portal returns an error until this configuration exists.
4. **Branding** — *Settings → Branding*: name, icon, dark accent color (appears in Checkout and the portal).
5. **Local webhooks** — install the Stripe CLI, then:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the printed `whsec_…` into the local `STRIPE_WEBHOOK_SECRET`.
6. **Deployed webhook** — *Developers → Webhooks → Add endpoint*
   - URL: `https://<your-domain>/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy that endpoint's signing secret into the deployed `STRIPE_WEBHOOK_SECRET`.
7. **Going live** — repeat steps 1–4 and 6 in live mode (products, prices, keys and webhook secrets are all separate), then set `ENFORCE_PLANS=true` in production.

---

## 8. Testing Checklist

### Automated

- [ ] `npm test` passes, including the new tests in §5.9
- [ ] `npm run build` passes **without** Stripe env vars set (the lazy client must not throw at import)
- [ ] `npm run lint` is clean

### Manual (test mode, `stripe listen` running, `ENFORCE_PLANS=true`)

Test cards: `4242 4242 4242 4242` succeeds · `4000 0025 0000 3155` requires 3D Secure · `4000 0000 0000 0341` attaches but fails on renewal. Any future expiry date and any CVC.

**Upgrade**
- [ ] Free user → `/settings/billing` shows Free, usage `n / 50` and `n / 3`, and both upgrade buttons
- [ ] Monthly checkout with 4242 → back on billing page showing **Pro** and a renewal date, with no manual refresh
- [ ] The DB row has `isPro = true`, `stripeCustomerId`, `stripeSubscriptionId` and `stripeCurrentPeriodEnd` (check with Neon MCP on the **development** branch)
- [ ] Yearly checkout on a second user → Pro, renewal date one year out
- [ ] Cancel from the Checkout page → back to billing with a "canceled" toast, still Free
- [ ] Checkout again while already Pro → error toast, no second subscription
- [ ] With the webhook listener stopped, finish checkout → Pro still shows (success-page sync); restart the listener → no errors on the replayed events

**Gating (Free user)**
- [ ] 51st item → error toast with the limit message
- [ ] 4th collection → error toast
- [ ] File/Image upload is rejected by UploadThing with the Pro message
- [ ] Editing, deleting, favoriting and pinning existing items still work
- [ ] With `ENFORCE_PLANS` unset → none of the limits apply

**Portal and changes**
- [ ] "Manage billing" opens the portal; "Return" goes back to `/settings/billing`
- [ ] Switch monthly → yearly in the portal → renewal date updates
- [ ] Cancel at period end → still Pro (status stays `active` until the period ends)
- [ ] `stripe subscriptions cancel <id>` (immediate) → `isPro` becomes false on the next page load
- [ ] Failed renewal (0341 card + a test clock advanced past renewal) → `past_due` → Pro removed

**Webhook security and robustness**
- [ ] POST to `/api/webhooks/stripe` without a signature → 400
- [ ] `stripe events resend <evt_id>` → same result, no errors (idempotent)
- [ ] `stripe trigger customer.subscription.updated` for an unknown customer → 200, no DB changes

**Account deletion**
- [ ] Deleting a Pro account cancels its subscription in Stripe before the user row is removed

---

## 9. Implementation Order

Each step builds on the previous one and leaves the app working.

1. **Dependencies and config** — `npm install stripe`, add env vars, Stripe Dashboard steps 1–3 and 5.
2. **Plan helpers** — `src/lib/plan.ts` and its tests. With `ENFORCE_PLANS` unset, nothing changes yet.
3. **Session `isPro`** — `next-auth.d.ts`, the `jwt`/`session` callbacks in `auth.ts`, `getSessionUser()` and its tests.
4. **Billing data layer** — `src/lib/stripe.ts`, `src/lib/db/billing.ts`, `src/lib/billing.ts` and their tests.
5. **Webhook route** — `/api/webhooks/stripe` and its tests; verify with `stripe trigger`.
6. **Billing actions** — `createCheckoutSession`, `createPortalSession` and their tests.
7. **Billing UI** — `/settings/billing` page, `src/components/billing/*`, Settings row and UserMenu link. Test the full checkout → Pro → portal loop by hand.
8. **Gating** — item and collection limits, Pro-type check in `createItem`, upload middleware; update the existing tests.
9. **Account deletion** — cancel the subscription in `deleteAccount`.
10. **Checks** — `npm test`, `npm run build`, run through the §8 manual checklist with `ENFORCE_PLANS=true`.
11. **Docs** — update the env section of `project-overview.md` and record the feature in `context/current-feature.md`.

This is large enough to split into two features if you prefer: **(A) Stripe billing**, steps 1–7 and 9, and **(B) plan enforcement**, step 8.

---

## 10. Open Questions

| Question | Suggested default |
| --- | --- |
| Should `past_due` keep Pro during Stripe's retry period? | No: only `active` and `trialing` are Pro. Change `PRO_STATUSES` if you want a grace period |
| What can a downgraded user do with items over the limit, and with their files? | Read, edit and delete everything, and download files; no new items, collections or uploads until they're under the limit or upgrade again |
| Free trial? | None. Adding one is just `subscription_data.trial_period_days` in Checkout |
| Promotion codes? | Off. Adding them is `allow_promotion_codes: true` |
| Taxes (Stripe Tax)? | Out of scope for now |
| Rate-limit the billing actions? | Not needed at launch: Stripe calls are cheap and the customer-creation idempotency key stops duplicates |
