import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
    } & DefaultSession["user"];
  }
}

// next-auth/jwt only re-exports @auth/core/jwt, so JWT is augmented at its source
declare module "@auth/core/jwt" {
  interface JWT {
    isPro?: boolean;
  }
}
