import { cache } from "react";
import { prisma } from "@/lib/db";
import type { ProfileUser } from "@/types/profile";

// Temporary until the dashboard queries use the session user: the dashboard and sidebar show the seeded demo user's data
const DEMO_USER_EMAIL = "demo@devstash.io";

// Cached per request so the layout and page share one lookup
export const getDemoUser = cache(async () => {
  return prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
});

export async function getProfileUser(userId: string): Promise<ProfileUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true, createdAt: true, password: true },
  });
  if (!user) return null;

  const { password, ...profile } = user;
  return { ...profile, hasPassword: password !== null };
}
