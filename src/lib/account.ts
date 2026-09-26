import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { PASSWORD_RESET_PREFIX } from "@/lib/password-reset";

const BCRYPT_ROUNDS = 12;

export type ChangePasswordResult = "changed" | "incorrect" | "no_password";

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
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
    select: { email: true },
  });
  if (!user) return;

  // Verification and reset tokens are keyed by email, so they don't cascade
  const tokenIdentifiers = user.email
    ? [user.email, `${PASSWORD_RESET_PREFIX}${user.email}`]
    : [];

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: { in: tokenIdentifiers } } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
