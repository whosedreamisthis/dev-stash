# Auth Security Review

**Last audit:** 2026-09-26
**Scope:** `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts`, `src/types/next-auth.d.ts`, `src/actions/auth.ts`, `src/actions/profile.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/(auth)/**` (sign-in, register, verify-email, forgot-password, reset-password), `src/app/profile/**`, `src/components/profile/**`, `src/components/auth/**`, `src/lib/tokens.ts`, `src/lib/verification.ts`, `src/lib/password-reset.ts`, `src/lib/account.ts`, `src/lib/email.ts`, `src/lib/validations/auth.ts`, `src/lib/db/users.ts`, `src/lib/db/sidebar.ts`, `prisma/schema.prisma`.

## Summary

The credentials/OAuth flows, email verification and password-reset flows are implemented carefully: tokens are high-entropy, hashed at rest, looked up by hash, checked for expiry at use time, deleted on success (race-safe), and the two token kinds can't be confused. Enumeration-sensitive endpoints (resend verification, forgot password) intentionally return uniform responses. The biggest real gap is the total absence of rate limiting on authentication endpoints, which allows unlimited online password guessing against sign-in. A few lower-severity issues round out the report (registration enumeration/squatting, bcrypt's byte-vs-character truncation, a timing side channel, and JWT sessions that outlive a password reset or account deletion).

| Severity | Count |
| --- | --- |
| Critical | 0 |
| High | 1 |
| Medium | 1 |
| Low | 3 |

## Findings

### [High] No rate limiting on credentials sign-in enables unlimited password guessing

- **Location:** `src/auth.ts:21-47` (`authorize`), `src/actions/auth.ts:54-92` (`signInWithCredentials`)
- **Issue:** The Credentials `authorize` callback does a straight `prisma.user.findUnique` + `bcrypt.compare` with no counter, lockout, CAPTCHA, or delay tied to the account or the caller's IP. There is no rate-limiting middleware anywhere in the repo (`grep` for `ratelimit`/`Ratelimit`/`x-forwarded-for` found nothing), and `src/proxy.ts` only redirects unauthenticated users away from `/dashboard` and `/profile` — it does not throttle `/api/auth/*` or the sign-in server action.
- **Attack scenario:** An anonymous attacker who knows or guesses a victim's email can call the `signInWithCredentials` server action (or POST directly to the NextAuth credentials callback endpoint) as many times as they want, trying a password list or a full brute-force, with no lockout or backoff. Given enough attempts this leads to account takeover for weak/reused passwords. The same lack of throttling also lets an attacker who has otherwise obtained a session cookie call `changeUserPassword` (`src/actions/profile.ts:24-61`) repeatedly to brute-force the current password with no lockout, since that action only checks the password with `bcrypt.compare` and returns `"incorrect"` on failure without any counter (`src/lib/account.ts:9-27`).
- **Fix:** Add server-side throttling in front of sign-in (and ideally register/change-password): a per-IP and per-account counter (e.g. Upstash Ratelimit, or a `LoginAttempt` table keyed by email+IP with exponential backoff) checked at the top of `authorize`/`signInWithCredentials` before the DB lookup, returning a generic failure once a threshold is hit.
- **Reference:** [OWASP Authentication Cheat Sheet – brute-force protection](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### [Medium] Unlimited registration allows account enumeration and email squatting

- **Location:** `src/app/api/auth/register/route.ts:36-47`
- **Issue:** `POST /api/auth/register` has no rate limiting and returns a distinguishable `409 "A user with this email already exists"` when the email is taken vs. `201` with the created user when it isn't. Because there is no limiter, an attacker can script this endpoint to enumerate which of many candidate emails already have DevStash accounts. Worse, for emails that are *not* yet registered, the attacker's request succeeds and creates a real account (with a password the attacker chose) using the victim's email address before the victim ever signs up — an account-squatting attack. (The legitimate owner can eventually reclaim it via "Forgot password" since that flow only requires proving inbox ownership, but they lose the ability to self-register with that email and get a confusing "already exists" message until they do.)
- **Attack scenario:** Attacker submits a list of candidate/target emails to `/api/auth/register`. Responses reveal which already have accounts (enumeration), and for the rest, the attacker now controls a real account tied to that email, forcing the real owner through the reset-password flow to regain access to their own signup.
- **Fix:** Add per-IP rate limiting to the register route, and consider a delay/CAPTCHA after a few attempts from the same IP. Optionally, for unverified accounts, allow a fresh registration with the same email to overwrite the unverified row instead of hard-blocking with 409, closing the squatting window.
- **Reference:** [OWASP Authentication Cheat Sheet – user enumeration prevention](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#user-enumeration-prevention)

### [Low] Password length limit is character-based, not byte-based, so bcrypt silently truncates some passwords

- **Location:** `src/lib/validations/auth.ts:10` (`newPassword = z.string().min(8).max(72)`), consumed by `register`, `resetPassword` (`src/lib/password-reset.ts:85`) and `changePassword` (`src/lib/account.ts:24`)
- **Issue:** bcrypt (and `bcryptjs`) truncates its input at 72 **bytes**, not 72 characters. The Zod schema caps passwords at 72 JS characters. A password using multi-byte UTF-8 characters (accented letters, non-Latin scripts, emoji) can be well under the 72-character limit while exceeding 72 bytes, so bcrypt hashes only a prefix of it. Two different passwords that share the same first-72-bytes-worth of characters would hash identically, and a user may believe their full password is significant when part of it is silently ignored.
- **Attack scenario:** Not directly exploitable by a third party, but it weakens the effective entropy of passwords for users who type long, non-ASCII passwords, and could let an attacker who knows the truncated prefix authenticate without the exact suffix the user intended.
- **Fix:** Either measure `Buffer.byteLength(password, "utf8") <= 72` in the Zod refinement instead of character count, or (better) pre-hash the password with SHA-256 before passing it to bcrypt so the 72-byte limit is never reached with normal passwords.
- **Reference:** [bcrypt 72-byte limit discussion](https://dev.to/tegos/bcrypt-and-laravel-72-bytes-not-72-characters-3jb1)

### [Low] Timing difference between "no such user" and "wrong password" on sign-in

- **Location:** `src/auth.ts:36-39`
- **Issue:** `if (!user?.password) return null;` returns immediately (a single indexed DB lookup) when the email doesn't exist or belongs to an OAuth-only account, whereas a matching account always incurs a `bcrypt.compare` (cost factor 12, tens of milliseconds) before returning. This produces a measurable timing difference between "account doesn't exist" and "account exists, wrong password," even though both cases show the same "Invalid email or password" message to the user.
- **Attack scenario:** An attacker sampling response times for many email addresses (averaging out network jitter) could distinguish which emails have DevStash accounts, aiding a targeted phishing or credential-stuffing campaign. This requires many samples and is not as immediate as the enumeration in Finding 2, hence Low.
- **Fix:** Perform a dummy `bcrypt.compare` against a fixed hash when no user/password is found, so both branches take comparable time, e.g. `await bcrypt.compare(password, DUMMY_HASH)` before returning `null`.
- **Reference:** [OWASP Authentication Cheat Sheet – timing attacks](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### [Low] Existing JWT sessions survive a password reset or account deletion

- **Location:** `src/auth.ts:58-64` (`session: { strategy: "jwt" }`), `src/lib/password-reset.ts:72-102` (`resetPassword`), `src/lib/account.ts:30-46` (`deleteAccount`)
- **Issue:** Sessions use the JWT strategy, and the `session()` callback only copies `token.sub` into `session.user.id` — it never re-checks the database. Resetting a password or deleting an account updates/removes the `User` row but does not rotate or invalidate any JWT already issued for that user. A session cookie minted before the reset/deletion continues to authenticate (using the Auth.js default session lifetime) until it naturally expires.
- **Attack scenario:** If an attacker obtained a victim's session cookie (e.g. via a shared/compromised device or an XSS elsewhere), using "Forgot password" to reset the password does not revoke the attacker's already-issued session — they keep acting as the victim until the JWT expires. This is a known limitation of pure JWT sessions without a server-side revocation list, so the impact is capped by the session lifetime, but it is worth being explicit about.
- **Fix:** If this scenario matters for the threat model, add a `tokenVersion`/`passwordChangedAt` claim checked in the `jwt`/`session` callback against the current DB value (one extra read, or cache it), and bump it on password reset, password change and account deletion so old tokens fail validation immediately. At minimum, consider a shorter `session.maxAge` for credentials-based accounts.
- **Reference:** [Auth.js session strategies](https://authjs.dev/concepts/session-strategies)

## Passed Checks

- ✅ Passwords are hashed server-side with bcrypt (12 rounds) on every path that sets one — register (`src/app/api/auth/register/route.ts:43`), reset (`src/lib/password-reset.ts:85`), and change (`src/lib/account.ts:24`); the plaintext password is never logged, stored or returned.
- ✅ `authorize()` returns only `{ id, name, email, image }`, never the password hash, and fails closed on invalid/missing input via `signInSchema.safeParse` (`src/auth.ts:22-47`).
- ✅ Sign-in failures always show the generic "Invalid email or password" (`src/actions/auth.ts:85-88`); email-not-verified status is only revealed *after* the password has already matched (`src/auth.ts:41-44`), so it doesn't help an attacker who doesn't know the password.
- ✅ Verification and reset tokens are 32 random bytes from `crypto.randomBytes` (256 bits of entropy) and stored only as SHA-256 hashes, looked up by hash (`src/lib/tokens.ts:7-14`, `src/lib/verification.ts:59-64`, `src/lib/password-reset.ts:20-27`).
- ✅ Expiration is enforced at use time, not just checked at creation, for both email verification (`src/lib/verification.ts:67-70`) and password reset (`src/lib/password-reset.ts:79-82`), with expired tokens deleted.
- ✅ Both flows are single-use: tokens are deleted after successful verification (`src/lib/verification.ts:72-78`) and reset (`src/lib/password-reset.ts:87-101`); the reset path deletes the token *inside* the transaction and checks the delete count, so two concurrent requests racing on the same token can't both succeed.
- ✅ Issuing a new verification or reset link deletes any previous tokens for that identifier first, in the same transaction (`src/lib/verification.ts:20-29`, `src/lib/password-reset.ts:43-52`).
- ✅ Verification and reset tokens share the `VerificationToken` table but can't be confused: reset identifiers are prefixed with `password-reset:` and email verification lookups explicitly exclude that prefix (`src/lib/verification.ts:58-64`, `src/lib/password-reset.ts:11-27`).
- ✅ Password reset links are only sent to accounts that actually have a password (`src/lib/password-reset.ts:30-35`); OAuth-only accounts can't be "reset."
- ✅ Resend-verification and forgot-password actions always return the same success response regardless of whether the account exists (`src/actions/auth.ts:95-129`, doc comments confirm this is intentional), and both are throttled per-identifier by `wasRecentlySent` (`src/lib/tokens.ts:31-41`).
- ✅ `EMAIL_VERIFICATION_ENABLED` is read only via `process.env` (no `NEXT_PUBLIC_` prefix, so it never reaches the client bundle) and defaults to enabled unless explicitly `"false"` (`src/lib/verification.ts:11-13`), i.e. it fails safe.
- ✅ Email links are built from `AUTH_URL` in production and only fall back to request headers in development, preventing host-header-poisoned reset/verification links (`src/lib/tokens.ts:16-28`).
- ✅ `callbackUrl` passed to `signIn(...)` is restricted to same-site relative paths (`getRedirectTo` rejects anything not starting with `/` or starting with `//`) before being used as `redirectTo`, preventing open redirects from the sign-in/register forms (`src/actions/auth.ts:46-52`).
- ✅ Every profile server action re-derives the user id from `auth()` / the session only — never from form data or params — and fails closed if there's no session (`src/actions/profile.ts:28-30, 64-66`).
- ✅ Change password requires and verifies the current password with `bcrypt.compare` before allowing a change, validates the new password with Zod, and explicitly refuses accounts with no password (`src/lib/account.ts:9-27`).
- ✅ Delete account is scoped to the session's `userId`, relies on the schema's `onDelete: Cascade` for items/collections/tags/accounts/sessions, additionally cleans up email-keyed verification/reset tokens that don't cascade, and signs the user out immediately after (`src/lib/account.ts:30-46`, `src/actions/profile.ts:63-78`).
- ✅ No password hash or token ever reaches a client component: `ProfileUser`/`getProfileUser` strips the password and exposes only a `hasPassword` boolean (`src/lib/db/users.ts:13-22`), and the sidebar reduces the session user to `{ name, email, image }` before passing it down (`src/lib/db/sidebar.ts:10-16`).
- ✅ `/dashboard/:path*` and `/profile/:path*` are gated by `src/proxy.ts`, and the profile page independently re-checks `auth()` server-side and redirects if the session user no longer exists in the DB (`src/app/profile/page.tsx:26-35`).

## Notes

- `src/app/dashboard/page.tsx` and `src/lib/db/sidebar.ts` still load collection/item data for a hard-coded demo account (`getDemoUser`, `DEMO_USER_EMAIL`) instead of the signed-in session user, while `src/app/profile/page.tsx` correctly uses the session user. This is explicitly called out in the codebase's own history/comments as temporary scaffolding predating full per-user data wiring, not a hidden flaw, and the data involved is non-sensitive seed content — but it means the dashboard does not yet enforce per-user data isolation. Flagging for awareness rather than as a scored finding, since it appears to be tracked, known, in-progress work rather than an oversight.
- Auth.js's default GitHub provider config (no `allowDangerousEmailAccountLinking`) means an attacker can't silently link a GitHub account to an existing credentials account by matching email; this is Auth.js's own protection and out of scope, but is called out here because it was checked.
