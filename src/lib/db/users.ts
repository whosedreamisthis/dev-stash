import { prisma } from "@/lib/db";

// Temporary until authentication is in place: the dashboard shows the seeded demo user's data
const DEMO_USER_EMAIL = "demo@devstash.io";

export async function getDemoUser() {
  return prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
}
