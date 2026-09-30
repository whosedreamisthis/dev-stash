import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, type ContentType } from "../src/generated/prisma/client";
import { buildDemoCollections, DEMO_COLLECTIONS, DEMO_ITEM_COUNT } from "../src/lib/demo-content";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEMO_USER = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
};

const SYSTEM_TYPES = [
  { name: "Snippet", slug: "snippets", icon: "Code", color: "#3b82f6", contentType: "TEXT", isProOnly: false },
  { name: "Prompt", slug: "prompts", icon: "Sparkles", color: "#8b5cf6", contentType: "TEXT", isProOnly: false },
  { name: "Command", slug: "commands", icon: "Terminal", color: "#f97316", contentType: "TEXT", isProOnly: false },
  { name: "Note", slug: "notes", icon: "StickyNote", color: "#fde047", contentType: "TEXT", isProOnly: false },
  { name: "File", slug: "files", icon: "File", color: "#6b7280", contentType: "FILE", isProOnly: true },
  { name: "Image", slug: "images", icon: "Image", color: "#ec4899", contentType: "FILE", isProOnly: true },
  { name: "Link", slug: "links", icon: "Link", color: "#10b981", contentType: "URL", isProOnly: false },
] as const;

async function seedItemTypes() {
  const types = new Map<string, { id: string; contentType: ContentType }>();

  for (const type of SYSTEM_TYPES) {
    // Postgres treats NULLs as distinct in unique constraints, so look up
    // system types by slug + null userId instead of relying on upsert
    const existing = await prisma.itemType.findFirst({
      where: { slug: type.slug, userId: null },
    });

    const saved = existing
      ? await prisma.itemType.update({
          where: { id: existing.id },
          data: { ...type, isSystem: true },
        })
      : await prisma.itemType.create({ data: { ...type, isSystem: true } });

    types.set(type.slug, { id: saved.id, contentType: saved.contentType });
  }

  return types;
}

async function seedUser() {
  const password = await bcrypt.hash(DEMO_USER.password, 12);

  return prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: { name: DEMO_USER.name, password, isPro: false, emailVerified: new Date() },
    create: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      password,
      isPro: false,
      emailVerified: new Date(),
    },
  });
}

async function seedCollections(
  userId: string,
  types: Map<string, { id: string; contentType: ContentType }>
) {
  // Start from a clean slate so re-running the seed doesn't duplicate data
  await prisma.item.deleteMany({ where: { userId } });
  await prisma.collection.deleteMany({ where: { userId } });

  for (const data of buildDemoCollections(userId, types)) {
    await prisma.collection.create({ data });
  }
}

async function main() {
  const types = await seedItemTypes();
  const user = await seedUser();
  await seedCollections(user.id, types);

  console.log(
    `Seeded ${SYSTEM_TYPES.length} system item types, demo user ${user.email}, ` +
      `${DEMO_COLLECTIONS.length} collections and ${DEMO_ITEM_COUNT} items`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
