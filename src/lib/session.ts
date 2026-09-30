import { auth } from "@/auth";

export const NOT_SIGNED_IN_ERROR = "You must be signed in.";

// The signed-in user's ID, or null when there's no session
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export interface SessionUser {
  id: string;
  isPro: boolean;
  isDemo: boolean;
}

// The signed-in user with their plan (synced from the database on each check)
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  return id
    ? { id, isPro: session.user.isPro ?? false, isDemo: session.user.isDemo ?? false }
    : null;
}
