import { cache } from "react";
import { prisma } from "@/lib/db";

// Temporary until authentication is in place: the dashboard shows the seeded demo user's data
const DEMO_USER_EMAIL = "demo@devstash.io";

// Cached per request so the layout and page share one lookup
export const getDemoUser = cache(async () => {
  return prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
});
