import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { PASSWORD_RESET_PREFIX } from "@/lib/password-reset";
import { checkRateLimit } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";

const BCRYPT_ROUNDS = 12;

export type ChangePasswordResult = "changed" | "incorrect" | "no_password" | "rate_limited";

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  // Limits guessing the current password from a hijacked session
  const { success } = await checkRateLimit("changePassword", userId);
  if (!success) return "rate_limited";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  // GitHub-only accounts have no password to change
  if (!user?.password) return "no_password";

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return "incorrect";

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  return "changed";
}

// Items, collections, tags, custom types, accounts and sessions cascade with the user
export async function deleteAccount(userId: string) {
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

  // Verification and reset tokens are keyed by email, so they don't cascade
  const tokenIdentifiers = user.email
    ? [user.email, `${PASSWORD_RESET_PREFIX}${user.email}`]
    : [];

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: { in: tokenIdentifiers } } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
