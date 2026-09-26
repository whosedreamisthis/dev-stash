import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export type VerifyEmailResult = "verified" | "invalid" | "expired";

// Only the hash is stored, so a leaked database row can't be used as a link
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function getAppUrl() {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");

  // Host headers can be forged, so only trust them in development
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_URL must be set to build verification links in production");
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

async function wasRecentlySent(email: string) {
  const latest = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: "desc" },
    select: { expires: true },
  });
  if (!latest) return false;

  const sentAt = latest.expires.getTime() - TOKEN_TTL_MS;
  return Date.now() - sentAt < RESEND_COOLDOWN_MS;
}

// Replaces any earlier tokens for the email and sends a fresh link
export async function sendVerificationLink(email: string) {
  const token = randomBytes(32).toString("hex");
  const verifyUrl = `${await getAppUrl()}/verify-email?token=${token}`;

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashToken(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  const sent = await sendVerificationEmail(email, verifyUrl).catch((error: unknown) => {
    console.error("Sending verification email failed:", error);
    return false;
  });

  // Drop the unsent token so the resend cooldown doesn't block an immediate retry
  if (!sent) {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  }
  return sent;
}

// Sends a new link only to unverified credentials users, at most once a minute
export async function resendVerificationLink(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true, emailVerified: true },
  });
  if (!user?.password || user.emailVerified) return;
  if (await wasRecentlySent(email)) return;

  await sendVerificationLink(email);
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  const record = await prisma.verificationToken.findFirst({
    where: { token: hashToken(token) },
  });
  if (!record) return "invalid";

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token: record.token } });
    return "expired";
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { email: record.identifier, emailVerified: null },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } }),
  ]);
  return "verified";
}
