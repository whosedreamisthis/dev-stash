import { auth } from "@/auth";

export const NOT_SIGNED_IN_ERROR = "You must be signed in.";

// The signed-in user's ID, or null when there's no session
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
