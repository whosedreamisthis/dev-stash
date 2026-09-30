import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
      isDemo: boolean;
    } & DefaultSession["user"];
  }

  // Set by the demo provider's authorize
  interface User {
    isDemo?: boolean;
  }
}

// next-auth/jwt only re-exports @auth/core/jwt, so JWT is augmented at its source
declare module "@auth/core/jwt" {
  interface JWT {
    isPro?: boolean;
    isDemo?: boolean;
  }
}
