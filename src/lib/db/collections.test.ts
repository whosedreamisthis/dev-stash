import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  createCollection,
  getCollectionById,
  getCollectionOptions,
  getCollections,
} from "@/lib/db/collections";

vi.mock("@/lib/db", () => ({
  prisma: { collection: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() } },
}));

const create = vi.mocked(prisma.collection.create);

const SNIPPET = { id: "t1", name: "Snippet", slug: "snippets", icon: "Code", color: "#3b82f6" };
const NOTE = { id: "t4", name: "Note", slug: "notes", icon: "StickyNote", color: "#fde047" };

describe("getCollections", () => {
  it("returns all of the user's collections, favorites first, as summaries", async () => {
    const findMany = vi.mocked(prisma.collection.findMany);
    findMany.mockResolvedValue([
      {
        id: "c1",
        name: "React Patterns",
        description: null,
        isFavorite: true,
        defaultType: null,
        items: [
          { item: { itemType: NOTE } },
          { item: { itemType: SNIPPET } },
          { item: { itemType: SNIPPET } },
        ],
      },
    ] as never);

    await expect(getCollections("user-1")).resolves.toEqual([
      {
        id: "c1",
        name: "React Patterns",
        description: null,
        isFavorite: true,
        itemCount: 3,
        types: [SNIPPET, NOTE],
        mainType: SNIPPET,
      },
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
      })
    );
  });
});

describe("getCollectionById", () => {
  it("scopes the lookup to the user and returns null when missing", async () => {
    const findFirst = vi.mocked(prisma.collection.findFirst);
    findFirst.mockResolvedValue(null);
    await expect(getCollectionById("user-1", "c1")).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "c1", userId: "user-1" } })
    );
  });
});

describe("getCollectionOptions", () => {
  it("returns the user's collection IDs and names sorted by name", async () => {
    const findMany = vi.mocked(prisma.collection.findMany);
    const options = [{ id: "c1", name: "React Patterns" }];
    findMany.mockResolvedValue(options as never);
    await expect(getCollectionOptions("user-1")).resolves.toEqual(options);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  });
});

describe("createCollection", () => {
  it("creates the collection for the user and returns an empty summary", async () => {
    create.mockResolvedValue({
      id: "col-1",
      name: "React Patterns",
      description: null,
      isFavorite: false,
      defaultType: null,
      items: [],
    } as never);

    await expect(
      createCollection("user-1", { name: "React Patterns", description: null })
    ).resolves.toEqual({
      id: "col-1",
      name: "React Patterns",
      description: null,
      isFavorite: false,
      itemCount: 0,
      types: [],
      mainType: null,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: "React Patterns", description: null, userId: "user-1" },
      })
    );
  });
});
