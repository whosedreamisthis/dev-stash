import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@devstash.io";
const DEMO_PASSWORD = "12345678";

const EXPECTED = {
  systemTypes: 7,
  collections: {
    "React Patterns": 3,
    "AI Workflows": 3,
    DevOps: 4,
    "Terminal Commands": 4,
    "Design Resources": 4,
  } as Record<string, number>,
};

const failures: string[] = [];

function check(condition: boolean, message: string) {
  console.log(`  ${condition ? "✓" : "✗"} ${message}`);
  if (!condition) failures.push(message);
}

async function testConnection() {
  const [{ now }] = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() AS now`;
  console.log(`Connected to the database (server time: ${now.toISOString()})`);
}

async function testSystemTypes() {
  const systemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
    orderBy: { name: "asc" },
  });

  console.log(`\nSystem item types (${systemTypes.length}):`);
  for (const type of systemTypes) {
    console.log(`  - ${type.name} (/items/${type.slug}) ${type.icon} ${type.color}${type.isProOnly ? " [Pro]" : ""}`);
  }
  check(systemTypes.length === EXPECTED.systemTypes, `${EXPECTED.systemTypes} system item types exist`);
}

async function testDemoUser() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });

  console.log("\nDemo user:");
  if (!user) {
    check(false, `demo user ${DEMO_EMAIL} exists`);
    return null;
  }

  console.log(`  ${user.name} <${user.email}> | Pro: ${user.isPro} | verified: ${user.emailVerified?.toISOString() ?? "no"}`);
  check(true, `demo user ${DEMO_EMAIL} exists`);
  check(!user.isPro, "demo user is on the free plan");
  check(user.emailVerified !== null, "demo user email is verified");
  check(
    user.password !== null && (await bcrypt.compare(DEMO_PASSWORD, user.password)),
    "demo user password matches the bcrypt hash"
  );
  return user;
}

async function testCollections(userId: string) {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      defaultType: true,
      items: { include: { item: { include: { itemType: true } } } },
    },
  });

  console.log(`\nCollections (${collections.length}):`);
  for (const collection of collections) {
    console.log(`\n  ${collection.name} — ${collection.description} [default: ${collection.defaultType?.name ?? "none"}]`);
    for (const { item } of collection.items) {
      const detail = item.url ?? (item.language ? `${item.language}, ${item.content?.length ?? 0} chars` : `${item.content?.length ?? 0} chars`);
      console.log(`    - [${item.itemType.name}] ${item.title} (${detail})`);
    }
  }

  console.log("\nChecks:");
  for (const [name, count] of Object.entries(EXPECTED.collections)) {
    const collection = collections.find((c) => c.name === name);
    check(collection?.items.length === count, `${name} has ${count} items`);
  }
}

async function testItems(userId: string) {
  const items = await prisma.item.findMany({ where: { userId }, include: { itemType: true } });
  const expectedTotal = Object.values(EXPECTED.collections).reduce((sum, n) => sum + n, 0);

  check(items.length === expectedTotal, `demo user has ${expectedTotal} items`);
  check(
    items.every((item) => item.contentType === item.itemType.contentType),
    "every item's content type matches its item type"
  );
  check(
    items.every((item) => (item.contentType === "URL" ? !!item.url : !!item.content)),
    "links have a URL and text items have content"
  );
}

async function main() {
  await testConnection();
  await testSystemTypes();
  const user = await testDemoUser();
  if (user) {
    await testCollections(user.id);
    await testItems(user.id);
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} check(s) failed`);
    process.exitCode = 1;
  } else {
    console.log("\nAll checks passed");
  }
}

main()
  .catch((error) => {
    console.error("Database test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
