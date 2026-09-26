import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";
import { prisma } from "@/lib/db";
import { signInSchema } from "@/lib/validations/auth";

export const EMAIL_NOT_VERIFIED = "email_not_verified";

class EmailNotVerifiedError extends CredentialsSignin {
  code = EMAIL_NOT_VERIFIED;
}

const credentialsProvider = Credentials({
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const parsed = signInSchema.safeParse(credentials);
    if (!parsed.success) return null;

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
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
    if (!user.emailVerified) throw new EmailNotVerifiedError();

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
