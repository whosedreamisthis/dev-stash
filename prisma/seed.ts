import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SYSTEM_TYPES = [
  { name: "Snippet", slug: "snippets", icon: "Code", color: "#3b82f6", contentType: "TEXT", isProOnly: false },
  { name: "Prompt", slug: "prompts", icon: "Sparkles", color: "#8b5cf6", contentType: "TEXT", isProOnly: false },
  { name: "Command", slug: "commands", icon: "Terminal", color: "#f97316", contentType: "TEXT", isProOnly: false },
  { name: "Note", slug: "notes", icon: "StickyNote", color: "#fde047", contentType: "TEXT", isProOnly: false },
  { name: "Link", slug: "links", icon: "Link", color: "#10b981", contentType: "URL", isProOnly: false },
  { name: "File", slug: "files", icon: "File", color: "#6b7280", contentType: "FILE", isProOnly: true },
  { name: "Image", slug: "images", icon: "Image", color: "#ec4899", contentType: "FILE", isProOnly: true },
] as const;

async function main() {
  for (const type of SYSTEM_TYPES) {
    // Postgres treats NULLs as distinct in unique constraints, so look up
    // system types by slug + null userId instead of relying on upsert
    const existing = await prisma.itemType.findFirst({
      where: { slug: type.slug, userId: null },
    });

    if (existing) {
      await prisma.itemType.update({
        where: { id: existing.id },
        data: { ...type, isSystem: true },
      });
    } else {
      await prisma.itemType.create({
        data: { ...type, isSystem: true },
      });
    }
  }

  console.log(`Seeded ${SYSTEM_TYPES.length} system item types`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
