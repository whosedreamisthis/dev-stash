import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/rate-limit";
import { signInSchema } from "@/lib/validations/auth";
import { isEmailVerificationEnabled } from "@/lib/verification";

export const EMAIL_NOT_VERIFIED = "email_not_verified";
export const RATE_LIMITED = "rate_limited";

class EmailNotVerifiedError extends CredentialsSignin {
  code = EMAIL_NOT_VERIFIED;
}

class RateLimitedError extends CredentialsSignin {
  code = RATE_LIMITED;
}

function getSignInKey(email: string, request: Request) {
  return `${getClientIp(request.headers) ?? "unknown"}:${email}`;
}

const credentialsProvider = Credentials({
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials, request) {
    const parsed = signInSchema.safeParse(credentials);
    if (!parsed.success) return null;

    // Counted before the password check so guesses are limited whether they succeed or not
    const { email } = parsed.data;
    const rateLimitKey = getSignInKey(email, request);
    const results = await Promise.all([
      checkRateLimit("signIn", rateLimitKey),
      checkRateLimit("signInEmail", email),
    ]);
    if (results.some((result) => !result.success)) throw new RateLimitedError();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        password: true,
        emailVerified: true,
      },
    });
    if (!user?.password) return null;

    const isValid = await bcrypt.compare(parsed.data.password, user.password);
    if (!isValid) return null;

    // Checked after the password so unverified status isn't revealed to guessers
    if (isEmailVerificationEnabled() && !user.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    // A correct password clears the email's failed attempts
    await Promise.all([
      resetRateLimit("signIn", rateLimitKey),
      resetRateLimit("signInEmail", email),
    ]);
    return { id: user.id, name: user.name, email: user.email, image: user.image };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: authConfig.providers.map((provider) =>
    typeof provider === "function" || provider.id !== "credentials"
      ? provider
      : credentialsProvider,
  ),
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
