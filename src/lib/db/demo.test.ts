import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createDemoUser, deleteExpiredDemoUsers } from "@/lib/db/demo";
import { DEMO_TTL_MS } from "@/lib/demo";
import { DEMO_COLLECTIONS, DEMO_ITEM_COUNT } from "@/lib/demo-content";

const tx = {
  user: { create: vi.fn() },
  collection: { create: vi.fn() },
};

vi.mock("@/lib/db", () => ({
  prisma: {
    itemType: { findMany: vi.fn() },
    item: { findMany: vi.fn() },
    user: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const SYSTEM_TYPES = [
  { id: "type-snippets", slug: "snippets", contentType: "TEXT" },
  { id: "type-prompts", slug: "prompts", contentType: "TEXT" },
  { id: "type-commands", slug: "commands", contentType: "TEXT" },
  { id: "type-links", slug: "links", contentType: "URL" },
];

const DEMO_USER = { id: "demo-1", name: "Demo Recruiter", email: "demo-x@demo.devstash.local" };

interface CreatedCollection {
  data: {
    userId: string;
    defaultTypeId: string;
    items: { create: { item: { create: { userId: string; itemTypeId: string } } }[] };
  };
}

describe("createDemoUser", () => {
  beforeEach(() => {
    vi.mocked(prisma.itemType.findMany).mockResolvedValue(SYSTEM_TYPES as never);
    vi.mocked(prisma.$transaction).mockImplementation((async (run: (client: typeof tx) => unknown) =>
      run(tx)) as never);
    tx.user.create.mockResolvedValue(DEMO_USER);
  });

  it("creates a verified Pro demo user with an unroutable email", async () => {
    await expect(createDemoUser()).resolves.toEqual(DEMO_USER);

    const { data } = tx.user.create.mock.calls[0][0];
    expect(data).toMatchObject({ isDemo: true, isPro: true, name: "Demo Recruiter" });
    expect(data.emailVerified).toBeInstanceOf(Date);
    expect(data.email).toMatch(/^demo-[0-9a-f]{16}@demo\.devstash\.local$/);
  });

  it("gives each demo user a different email", async () => {
    await createDemoUser();
    await createDemoUser();
    const [first, second] = tx.user.create.mock.calls.map(([args]) => args.data.email);
    expect(first).not.toBe(second);
  });

  it("copies every demo collection and item into the new user", async () => {
    await createDemoUser();

    const calls = tx.collection.create.mock.calls as [CreatedCollection][];
    expect(calls).toHaveLength(DEMO_COLLECTIONS.length);

    const items = calls.flatMap(([{ data }]) => data.items.create.map(({ item }) => item.create));
    expect(items).toHaveLength(DEMO_ITEM_COUNT);
    // Everything belongs to the new user, never to another account
    expect(calls.every(([{ data }]) => data.userId === "demo-1")).toBe(true);
    expect(items.every((item) => item.userId === "demo-1")).toBe(true);
  });

  it("uses only system item types", async () => {
    await createDemoUser();
    expect(prisma.itemType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isSystem: true, userId: null }),
      })
    );
  });

  it("throws inside the transaction when a system type is missing", async () => {
    vi.mocked(prisma.itemType.findMany).mockResolvedValue(SYSTEM_TYPES.slice(1) as never);
    await expect(createDemoUser()).rejects.toThrow('Missing system item type "snippets"');
  });
});

describe("deleteExpiredDemoUsers", () => {
  const NOW = new Date("2026-09-30T12:00:00Z").getTime();
  const CUTOFF = new Date(NOW - DEMO_TTL_MS);
  const EXPIRED = { isDemo: true, createdAt: { lt: CUTOFF } };

  it("deletes only demo users past the TTL and returns their file keys", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      { fileUrl: "key-1" },
      { fileUrl: "key-2" },
    ] as never);

    await expect(deleteExpiredDemoUsers(NOW)).resolves.toEqual(["key-1", "key-2"]);
    expect(prisma.item.findMany).toHaveBeenCalledWith({
      where: { user: EXPIRED, fileUrl: { not: null } },
      select: { fileUrl: true },
    });
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({ where: EXPIRED });
  });

  it("returns no keys when the expired demos have no files", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([]);
    await expect(deleteExpiredDemoUsers(NOW)).resolves.toEqual([]);
  });
});
