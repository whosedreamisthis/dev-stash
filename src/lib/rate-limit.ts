import { prisma } from "@/lib/db";

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

export const RATE_LIMITS = {
  signInEmail: { limit: 5, windowMs: FIFTEEN_MINUTES },
  signInIp: { limit: 20, windowMs: FIFTEEN_MINUTES },
  changePassword: { limit: 5, windowMs: FIFTEEN_MINUTES },
  registerIp: { limit: 10, windowMs: ONE_HOUR },
} satisfies Record<string, RateLimitRule>;

// Counts an attempt against the key. A single upsert keeps the increment atomic
// across concurrent requests and serverless instances, and restarts expired windows
export async function consumeRateLimit(
  key: string,
  { limit, windowMs }: RateLimitRule,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMs);

  const [row] = await prisma.$queryRaw<{ count: number; expiresAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, ${windowEnd})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."expiresAt" <= ${now} THEN 1
                     ELSE "RateLimit"."count" + 1 END,
      "expiresAt" = CASE WHEN "RateLimit"."expiresAt" <= ${now} THEN ${windowEnd}
                         ELSE "RateLimit"."expiresAt" END
    RETURNING "count", "expiresAt"
  `;

  return {
    allowed: row.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function resetRateLimit(key: string) {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

// Only trustworthy behind a proxy that sets these headers (e.g. Vercel);
// per-account limits still apply when they're missing or spoofed.
// Returns null when unknown so callers don't put every client in one shared bucket
export function getClientIp(headers: Headers) {
  const ip =
    headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip || null;
}

export function formatRetryAfter(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "a minute" : `${minutes} minutes`;
}
