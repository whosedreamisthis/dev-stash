import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  createCollection,
  deleteCollection,
  getCollectionById,
  getCollectionOptions,
  getCollections,
  getFavoriteCollections,
  getSearchCollections,
  updateCollection,
} from "@/lib/db/collections";

vi.mock("@/lib/db", () => ({
  prisma: {
    collection: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

const create = vi.mocked(prisma.collection.create);

const SNIPPET = { id: "t1", name: "Snippet", slug: "snippets", icon: "Code", color: "#3b82f6" };
const NOTE = { id: "t4", name: "Note", slug: "notes", icon: "StickyNote", color: "#fde047" };

const COLLECTION_ROW = {
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
};

const COLLECTION_SUMMARY = {
  id: "c1",
  name: "React Patterns",
  description: null,
  isFavorite: true,
  itemCount: 3,
  types: [SNIPPET, NOTE],
  mainType: SNIPPET,
};

describe("getSearchCollections", () => {
  it("returns all of the user's collections, favorites first, as summaries", async () => {
    const findMany = vi.mocked(prisma.collection.findMany);
    findMany.mockResolvedValue([COLLECTION_ROW] as never);

    await expect(getSearchCollections("user-1")).resolves.toEqual([COLLECTION_SUMMARY]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
      })
    );
    expect(findMany.mock.calls[0][0]).not.toHaveProperty("take");
  });
});

describe("getFavoriteCollections", () => {
  it("returns the user's favorited collections, most recently updated first", async () => {
    const findMany = vi.mocked(prisma.collection.findMany);
    const updatedAt = new Date("2026-01-02T00:00:00Z");
    findMany.mockResolvedValue([{ ...COLLECTION_ROW, updatedAt }] as never);

    await expect(getFavoriteCollections("user-1")).resolves.toEqual([
      { ...COLLECTION_SUMMARY, updatedAt },
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", isFavorite: true },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      })
    );
  });
});

describe("getCollections", () => {
  const findMany = vi.mocked(prisma.collection.findMany);
  const count = vi.mocked(prisma.collection.count);

  it("fetches only the requested page of the user's collections", async () => {
    findMany.mockResolvedValue([COLLECTION_ROW] as never);
    count.mockResolvedValue(45);

    await expect(getCollections("user-1", 2)).resolves.toEqual({
      items: [COLLECTION_SUMMARY],
      total: 45,
      page: 2,
      totalPages: 3,
    });
    expect(count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
        skip: 21,
        take: 21,
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

describe("updateCollection", () => {
  const DATA = { name: "Hooks", description: "Custom hooks" };

  it("returns null without updating when the collection isn't the user's", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);
    await expect(updateCollection("user-1", "c1", DATA)).resolves.toBeNull();
    expect(prisma.collection.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "c1", userId: "user-1" } })
    );
    expect(prisma.collection.update).not.toHaveBeenCalled();
  });

  it("updates the name and description and returns the summary", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue({ id: "c1" } as never);
    vi.mocked(prisma.collection.update).mockResolvedValue({
      id: "c1",
      ...DATA,
      isFavorite: false,
      defaultType: null,
      items: [{ item: { itemType: SNIPPET } }],
    } as never);

    await expect(updateCollection("user-1", "c1", DATA)).resolves.toEqual({
      id: "c1",
      ...DATA,
      isFavorite: false,
      itemCount: 1,
      types: [SNIPPET],
      mainType: SNIPPET,
    });
    expect(prisma.collection.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "c1" }, data: DATA })
    );
  });
});

describe("deleteCollection", () => {
  it("deletes only the user's collection and reports whether one was deleted", async () => {
    const deleteMany = vi.mocked(prisma.collection.deleteMany);
    deleteMany.mockResolvedValue({ count: 1 });
    await expect(deleteCollection("user-1", "c1")).resolves.toBe(true);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "c1", userId: "user-1" } });

    deleteMany.mockResolvedValue({ count: 0 });
    await expect(deleteCollection("user-1", "other")).resolves.toBe(false);
  });
});
