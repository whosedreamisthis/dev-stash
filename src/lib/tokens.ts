import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

const RESEND_COOLDOWN_MS = 60 * 1000;

export function generateToken() {
  return randomBytes(32).toString("hex");
}

// Only the hash is stored, so a leaked database row can't be used as a link
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getAppUrl() {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");

  // Host headers can be forged, so only trust them in development
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_URL must be set to build email links in production");
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

// True when a token for the identifier was created within the last minute
export async function wasRecentlySent(identifier: string, ttlMs: number) {
  const latest = await prisma.verificationToken.findFirst({
    where: { identifier },
    orderBy: { expires: "desc" },
    select: { expires: true },
  });
  if (!latest) return false;

  const sentAt = latest.expires.getTime() - ttlMs;
  return Date.now() - sentAt < RESEND_COOLDOWN_MS;
}
