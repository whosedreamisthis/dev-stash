import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitRule {
  limit: number;
  window: Duration;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

const RATE_LIMITS = {
  signIn: { limit: 5, window: "15 m" },
  // Per-account cap so rotating IPs can't multiply guesses against one email
  signInEmail: { limit: 10, window: "15 m" },
  register: { limit: 3, window: "1 h" },
  forgotPassword: { limit: 3, window: "1 h" },
  resetPassword: { limit: 5, window: "15 m" },
  resendVerification: { limit: 3, window: "15 m" },
  changePassword: { limit: 5, window: "15 m" },
} satisfies Record<string, RateLimitRule>;

export type RateLimitName = keyof typeof RATE_LIMITS;

const KEY_PREFIX = "devstash:ratelimit";

let redis: Redis | null | undefined;
const limiters = new Map<RateLimitName, Ratelimit>();

// Created on first use so a missing config doesn't break imports or the build
function getRedis() {
  if (redis === undefined) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    redis = url && token ? new Redis({ url, token }) : null;
    if (!redis) console.warn("Upstash Redis is not configured; rate limiting is disabled.");
  }
  return redis;
}

function getLimiter(name: RateLimitName) {
  const client = getRedis();
  if (!client) return null;

  let limiter = limiters.get(name);
  if (!limiter) {
    const { limit, window } = RATE_LIMITS[name];
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `${KEY_PREFIX}:${name}`,
      // A slow Upstash lets the request through instead of stalling sign-in
      timeout: 3000,
    });
    limiters.set(name, limiter);
  }
  return limiter;
}

// Fails open: auth keeps working when Upstash is unavailable or not configured
export async function checkRateLimit(
  name: RateLimitName,
  identifier: string,
): Promise<RateLimitResult> {
  const allowed = { success: true, remaining: RATE_LIMITS[name].limit, reset: Date.now() };
  const limiter = getLimiter(name);
  if (!limiter) return allowed;

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch (error) {
    console.error(`Rate limit check failed (${name}):`, error);
    return allowed;
  }
}

export async function resetRateLimit(name: RateLimitName, identifier: string) {
  try {
    await getLimiter(name)?.resetUsedTokens(identifier);
  } catch (error) {
    console.error(`Rate limit reset failed (${name}):`, error);
  }
}

// Only trustworthy behind a proxy that sets these headers (e.g. Vercel).
// Returns null when unknown so callers don't put every client in one shared bucket
export function getClientIp(headers: Headers) {
  // x-real-ip first: proxies set it outright, while x-forwarded-for can carry client-supplied entries
  const ip =
    headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip || null;
}

export function getRetryAfterSeconds(reset: number) {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

export function getRateLimitMessage(reset: number) {
  const minutes = Math.ceil(getRetryAfterSeconds(reset) / 60);
  const wait = minutes <= 1 ? "1 minute" : `${minutes} minutes`;
  return `Too many attempts. Please try again in ${wait}.`;
}
