# Stripe Integration Phase 2 - Integration & UI

## Overview

Wire the Phase 1 infrastructure into the app: the Stripe webhook, Checkout and Customer Portal actions, the `/settings/billing` page, and free-tier gating on items, collections and uploads. Requires Phase 1 to be merged, and the Stripe CLI for local webhook testing.

Full reference: [docs/stripe-integration-plan.md](../../docs/stripe-integration-plan.md) (§5.5–§5.9, §6.5–§6.11, §7, §8, implementation order steps 5–11).

## Requirements

### Webhook route — `src/app/api/webhooks/stripe/route.ts` (plan §5.6)

- Read the raw body with `request.text()` and verify it with `constructEvent` and `STRIPE_WEBHOOK_SECRET`
- Missing signature or secret → 400; bad signature → 400
- Pass the event to `handleStripeEvent`; if it throws → 500 so Stripe retries
- Success → `{ received: true }`
- Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### Billing actions — `src/actions/billing.ts` (plan §5.5)

- `createCheckoutSession(interval)`: session check, Zod-validate `"monthly" | "yearly"`, refuse if the user already has a subscription, get or create the customer, create a hosted Checkout session with `client_reference_id: userId`; return `{ success, data: { url } }`
- `createPortalSession()`: returns the portal URL, or an error when the user has no Stripe customer
- Success URL: `/settings/billing?session_id={CHECKOUT_SESSION_ID}`; cancel URL: `/settings/billing?checkout=canceled`; both built from `getAppUrl()`

### Billing UI (plan §5.7–§5.8, §6.9–§6.10)

- `src/app/settings/billing/page.tsx`: server component under the settings layout. On `?session_id=`, call `syncCheckoutSession` (best effort) then redirect to `?checkout=success`. Loads the billing user, item count and collection count
- `src/components/billing/`:
  - `BillingPlanCard` (server): Free / Pro, renewal date, usage bars (`n / 50` items, `n / 3` collections, hidden for Pro), and the upgrade or manage buttons
  - `UpgradeButtons` (client): "$8 / month" and "$72 / year — save 25%"; pending state, toast on error, `window.location.assign` on success
  - `ManageBillingButton` (client): opens the portal
  - `CheckoutToast` (client): one-time Sonner toast for `?checkout=success|canceled`
- Style like the `AccountActions` rows (`rounded-xl border bg-card p-5`) with shadcn `Button`
- `/settings`: add a "Plan" row (Free / Pro) linking to `/settings/billing`
- `UserMenu`: add a "Billing" item (Lucide `CreditCard`) between Settings and Sign out

### Feature gating (plan §6.5–§6.7)

Uses `getSessionUser()` and the Phase 1 `usage-limits` module. With `ENFORCE_PLANS` unset nothing is limited.

- `createItem`: File/Image types (`isUploadTypeSlug`) require Pro → `PRO_REQUIRED_ERROR`; `checkItemLimit(user)` before creating → `ITEM_LIMIT_ERROR`
- `createCollection`: `checkCollectionLimit(user)` → `COLLECTION_LIMIT_ERROR`
- `uploadMiddleware` in `src/lib/uploadthing.ts`: throw an `UploadThingError` for users without Pro access, so files are never stored
- Leave updates, deletes, favorites, pins and file downloads ungated, so downgraded users keep access to what they have
- Errors show in the existing toasts

### Account deletion (plan §6.8)

- `src/lib/account.ts`: cancel the user's Stripe subscription before deleting the user; if cancelling fails, keep the account and return the generic error

### Docs

- `context/project-overview.md`: add `ENFORCE_PLANS` to the env block and mark `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` as unused for now

## Testing

### Unit tests (Vitest, mocked Stripe and DB)

- `src/app/api/webhooks/stripe/route.test.ts`: missing signature → 400, bad signature → 400, handler throws → 500, success → 200 (follow `api/items/[id]/file/route.test.ts`)
- `src/actions/billing.test.ts`: no session, invalid interval, already subscribed, happy path returns the URL with the right price and `client_reference_id`, Stripe failure returns the generic error; portal with and without a customer
- Update `src/actions/items.test.ts`, `src/actions/collections.test.ts` and `src/lib/uploadthing.test.ts`: limits and Pro checks with `vi.stubEnv("ENFORCE_PLANS", "true")`, and no limits when it's unset
- Account deletion: subscription is cancelled before the delete; a Stripe failure keeps the account
- `npm test`, `npm run build` and `npm run lint` pass

### Stripe setup (test mode, plan §7)

1. Create the "DevStash Pro" product with $8/month and $72/year prices; copy the price IDs into `.env`
2. Configure the Customer Portal (payment methods, invoices, cancel at period end, switching between the two prices)
3. Install the Stripe CLI, then:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`

### Manual checks (`stripe listen` running, `ENFORCE_PLANS=true`)

Test cards: `4242 4242 4242 4242` succeeds, `4000 0025 0000 3155` requires 3D Secure. Any future expiry and any CVC.

1. Free user → `/settings/billing` shows Free, usage and both upgrade buttons
2. Monthly checkout → back on billing showing Pro and a renewal date; DB row updated (check with Neon MCP on the **development** branch)
3. Yearly checkout on a second user → renewal date a year out
4. Cancel on the Checkout page → "canceled" toast, still Free
5. Checkout while already Pro → error toast
6. Stop `stripe listen`, finish a checkout → Pro still shows (success-page sync); restart → replayed events cause no errors
7. Free user: 51st item, 4th collection and a File/Image upload are all rejected with toasts; edit/delete/favorite/pin still work
8. "Manage billing" opens the portal and returns to `/settings/billing`; switching to yearly updates the renewal date
9. `stripe subscriptions cancel <id>` → Free on the next page load
10. `stripe events resend <evt_id>` → no errors; POST to the webhook without a signature → 400
11. Deleting a Pro account cancels its subscription in Stripe

## Out of Scope

Live-mode setup and the production webhook endpoint (plan §7 steps 6–7), trials, promotion codes, Stripe Tax.

## References

- Stripe Checkout: https://docs.stripe.com/payments/checkout
- Customer Portal: https://docs.stripe.com/customer-management
- Webhooks: https://docs.stripe.com/webhooks
- Stripe CLI: https://docs.stripe.com/stripe-cli
