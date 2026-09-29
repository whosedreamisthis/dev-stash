# Stripe Integration Phase 1 - Core Infrastructure

## Overview

Build the foundation for DevStash Pro ($8/month or $72/year): the Stripe client, a central usage-limits module, `isPro` on the session, and the billing data layer that syncs subscriptions into the database. Nothing is user-facing yet, and with `ENFORCE_PLANS` unset the app behaves exactly as it does today.

Full reference: [docs/stripe-integration-plan.md](../../docs/stripe-integration-plan.md) (§3–§6, implementation order steps 1–4).

## Requirements

### Dependencies and config

- `npm install stripe`
- Add to `.env` (test-mode values):
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET` (placeholder until Phase 2)
  - `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`
  - `ENFORCE_PLANS` ("true" turns on free-tier limits; anything else means everyone is Pro)
- No `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: hosted Checkout is a plain redirect
- No migration: `isPro`, `stripeCustomerId`, `stripeSubscriptionId` and `stripeCurrentPeriodEnd` already exist on `User`

### `src/lib/stripe.ts` — lazy client (plan §5.1)

- `getStripe()` creates the client on first use and throws only when called without `STRIPE_SECRET_KEY`, so imports and the build work without Stripe env vars
- `getPriceId(interval)` maps `"monthly" | "yearly"` to the price env var
- Don't pin `apiVersion`

### `src/lib/usage-limits.ts` — central gating (plan §5.2)

This is the single place for plan and limit checks (the spec's `src/lib/plan.ts`; update the references in `context/project-overview.md`).

- `FREE_LIMITS = { items: 50, collections: 3 }`
- Error constants: `PRO_REQUIRED_ERROR`, `ITEM_LIMIT_ERROR`, `COLLECTION_LIMIT_ERROR`
- `hasProAccess(user)`: true when `ENFORCE_PLANS !== "true"`, otherwise `user.isPro`. Read `ENFORCE_PLANS` at call time so tests can use `vi.stubEnv`
- `isAtLimit(user, count, limit)`: `!hasProAccess(user) && count >= limit`
- `checkItemLimit(user)` / `checkCollectionLimit(user)`: count the user's items / collections and return the limit error string, or `null` when they may create another. Skip the count query entirely when the user has Pro access
- `countCollections(userId)` goes in `src/lib/db/collections.ts`; items reuse `getItemStats(userId).total`

### Session `isPro` (plan §6.2–§6.4)

- `src/types/next-auth.d.ts`: add `isPro: boolean` to `Session.user` and `isPro?: boolean` to `JWT`
- `src/auth.ts`: add a `jwt` callback that re-reads `isPro` from the DB on every session check (so webhook changes show up without `update()`), and copy it into the session in the `session` callback. Keep it out of `auth.config.ts` (edge proxy bundle)
- `src/lib/session.ts`: add `getSessionUser()` returning `{ id, isPro } | null`. Keep `getSessionUserId()` unchanged

### Billing data layer (plan §5.3–§5.4)

- `src/lib/db/billing.ts`: `getBillingUser`, `setStripeCustomerId`, `syncSubscription`
  - `syncSubscription` is idempotent: `active` / `trialing` set Pro, the subscription ID and the period end (from `subscription.items.data[0].current_period_end`); any other status clears Pro only when the stored subscription ID matches
- `src/lib/billing.ts`: `getOrCreateCustomerId` (with an idempotency key), `syncSubscriptionById` (always re-fetches from Stripe), `handleStripeEvent` (checkout completed + subscription created/updated/deleted), `syncCheckoutSession` (only for the signed-in user's completed sessions)

## Testing

Unit tests with Vitest, next to the code, mocking `@/lib/db`, `@/lib/stripe` and `@/auth`. Nothing touches Stripe or Neon.

### `src/lib/usage-limits.test.ts` (required)

- `hasProAccess`: `ENFORCE_PLANS` unset → true for free users; `"true"` → follows `isPro`; other values (`"false"`, `"1"`) → true
- `isAtLimit`: below, at and above the limit for a free user with enforcement on; always false for Pro; always false with enforcement off
- `checkItemLimit` / `checkCollectionLimit`: return `null` under the limit, the right error at 50 items / 3 collections, `null` for Pro users, and don't query counts when the user has Pro access (or enforcement is off)
- Error messages include the limit numbers from `FREE_LIMITS`

### Other tests

- `src/lib/db/billing.test.ts`: `syncSubscription` for active, trialing, canceled and past_due; clearing only the matching subscription; string vs expanded `customer`; missing period end
- `src/lib/billing.test.ts`: `handleStripeEvent` routes each event to a re-fetch and ignores other events and non-subscription checkouts; `syncCheckoutSession` ignores other users' and incomplete sessions; `getOrCreateCustomerId` reuses an existing customer and saves a new one
- `src/lib/session.test.ts`: `getSessionUser` with no session, and with `isPro` true/false

### Checks

- `npm test` passes
- `npm run build` passes **without** Stripe env vars set
- Signing in and using the app works as before (everyone still has full access)

## Out of Scope (Phase 2)

Webhook route, Checkout/Portal actions, billing UI, gating in `createItem` / `createCollection` / uploads, cancelling subscriptions on account deletion.

## References

- Research: [context/research/stripe-integration-research.md](../research/stripe-integration-research.md)
- Stripe subscriptions: https://docs.stripe.com/billing/subscriptions/overview
- Auth.js callbacks: https://authjs.dev/reference/nextjs#callbacks
