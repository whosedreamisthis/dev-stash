import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { DEMO_TTL_MS } from "@/lib/demo";
import { buildDemoCollections, DEMO_COLLECTIONS } from "@/lib/demo-content";

export interface DemoUser {
  id: string;
  name: string | null;
  email: string | null;
}

const DEMO_TYPE_SLUGS = [
  ...new Set(
    DEMO_COLLECTIONS.flatMap((collection) => [
      collection.defaultType,
      ...collection.items.map((item) => item.type),
    ])
  ),
];

// Creating a user plus five collections of nested items takes several round trips
const DEMO_TRANSACTION_TIMEOUT_MS = 15_000;

// A fresh Pro account with its own copy of the demo content; all or nothing
export async function createDemoUser(): Promise<DemoUser> {
  const types = await prisma.itemType.findMany({
    where: { slug: { in: DEMO_TYPE_SLUGS }, isSystem: true, userId: null },
    select: { id: true, slug: true, contentType: true },
  });
  const typesBySlug = new Map(types.map((type) => [type.slug, type]));

  return prisma.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: {
          name: "Demo Recruiter",
          // Unique and unroutable, so it never collides with a real sign-up
          email: `demo-${randomBytes(8).toString("hex")}@demo.devstash.local`,
          emailVerified: new Date(),
          isDemo: true,
          isPro: true,
        },
        select: { id: true, name: true, email: true },
      });

      for (const data of buildDemoCollections(user.id, typesBySlug)) {
        await tx.collection.create({ data });
      }
      return user;
    },
    { timeout: DEMO_TRANSACTION_TIMEOUT_MS }
  );
}

// Deletes demo accounts older than the TTL (their data cascades) and returns the
// UploadThing keys of their files, which the caller removes from storage
export async function deleteExpiredDemoUsers(now = Date.now()): Promise<string[]> {
  const expired = { isDemo: true, createdAt: { lt: new Date(now - DEMO_TTL_MS) } };

  const files = await prisma.item.findMany({
    where: { user: expired, fileUrl: { not: null } },
    select: { fileUrl: true },
  });
  await prisma.user.deleteMany({ where: expired });

  return files.flatMap(({ fileUrl }) => (fileUrl ? [fileUrl] : []));
}
