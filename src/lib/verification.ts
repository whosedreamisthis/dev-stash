import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { PASSWORD_RESET_PREFIX } from "@/lib/password-reset";
import { generateToken, getAppUrl, hashToken, wasRecentlySent } from "@/lib/tokens";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type VerifyEmailResult = "verified" | "invalid" | "expired";

// On unless explicitly disabled, so a missing variable never turns verification off
export function isEmailVerificationEnabled() {
  return process.env.EMAIL_VERIFICATION_ENABLED !== "false";
}

// Replaces any earlier tokens for the email and sends a fresh link
export async function sendVerificationLink(email: string) {
  const token = generateToken();
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
  if (!isEmailVerificationEnabled()) return;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true, emailVerified: true },
  });
  if (!user?.password || user.emailVerified) return;
  if (await wasRecentlySent(email, TOKEN_TTL_MS)) return;

  await sendVerificationLink(email);
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  // Password reset tokens share the table, so they must never verify an email
  const record = await prisma.verificationToken.findFirst({
    where: {
      token: hashToken(token),
      NOT: { identifier: { startsWith: PASSWORD_RESET_PREFIX } },
    },
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
