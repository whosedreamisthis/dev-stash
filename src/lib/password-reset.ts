import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateToken, getAppUrl, hashToken, wasRecentlySent } from "@/lib/tokens";

const TOKEN_TTL_MS = 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

// Reset tokens share VerificationToken with email verification, so their identifier
// is prefixed to keep the two kinds from finding or deleting each other
export const PASSWORD_RESET_PREFIX = "password-reset:";

export type ResetTokenStatus = "valid" | "invalid" | "expired";
export type ResetPasswordResult = "reset" | "invalid" | "expired";

function toIdentifier(email: string) {
  return `${PASSWORD_RESET_PREFIX}${email}`;
}

async function findResetToken(token: string) {
  return prisma.verificationToken.findFirst({
    where: {
      token: hashToken(token),
      identifier: { startsWith: PASSWORD_RESET_PREFIX },
    },
  });
}

// Sends a reset link only to credentials users, at most once a minute
export async function sendPasswordResetLink(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true },
  });
  if (!user?.password) return;

  const identifier = toIdentifier(email);
  if (await wasRecentlySent(identifier, TOKEN_TTL_MS)) return;

  const token = generateToken();
  const resetUrl = `${await getAppUrl()}/reset-password?token=${token}`;

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  const sent = await sendPasswordResetEmail(email, resetUrl).catch((error: unknown) => {
    console.error("Sending password reset email failed:", error);
    return false;
  });

  // Drop the unsent token so the cooldown doesn't block an immediate retry
  if (!sent) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
  }
}

// Checks a token without using it, so the reset page can show the right message
export async function getResetTokenStatus(token: string): Promise<ResetTokenStatus> {
  const record = await findResetToken(token);
  if (!record) return "invalid";
  return record.expires < new Date() ? "expired" : "valid";
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<ResetPasswordResult> {
  const record = await findResetToken(token);
  if (!record) return "invalid";

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token: record.token } });
    return "expired";
  }

  const email = record.identifier.slice(PASSWORD_RESET_PREFIX.length);
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  return prisma.$transaction(async (tx) => {
    // Deleting first makes the token single-use even if two requests race
    const { count } = await tx.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    });
    if (count === 0) return "invalid";

    await tx.user.updateMany({ where: { email }, data: { password: hashedPassword } });
    // Opening the link proves the user owns the inbox
    await tx.user.updateMany({
      where: { email, emailVerified: null },
      data: { emailVerified: new Date() },
    });
    return "reset";
  });
}
