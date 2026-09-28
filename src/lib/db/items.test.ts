import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  createItem,
  deleteItem,
  getItemDetail,
  getItemFile,
  getItemsByCollection,
  getItemsByType,
  getSearchItems,
  toCollectionLinks,
  toTagLinks,
  updateItem,
} from "@/lib/db/items";

vi.mock("@/lib/db", () => ({
  prisma: {
    item: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    itemType: { findFirst: vi.fn() },
    itemTag: { deleteMany: vi.fn() },
    itemCollection: { deleteMany: vi.fn() },
    collection: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const findFirst = vi.mocked(prisma.item.findFirst);
const findMany = vi.mocked(prisma.item.findMany);
const count = vi.mocked(prisma.item.count);
const update = vi.mocked(prisma.item.update);
const deleteTagLinks = vi.mocked(prisma.itemTag.deleteMany);
const deleteCollectionLinks = vi.mocked(prisma.itemCollection.deleteMany);
const findCollections = vi.mocked(prisma.collection.findMany);

describe("toCollectionLinks", () => {
  it("connects each collection by ID", () => {
    expect(toCollectionLinks(["c1", "c2"])).toEqual({
      create: [
        { collection: { connect: { id: "c1" } } },
        { collection: { connect: { id: "c2" } } },
      ],
    });
  });
});

describe("toTagLinks", () => {
  it("connects or creates each of the user's tags by name", () => {
    expect(toTagLinks("user-1", ["react", "auth"])).toEqual({
      create: [
        {
          tag: {
            connectOrCreate: {
              where: { userId_name: { userId: "user-1", name: "react" } },
              create: { name: "react", userId: "user-1" },
            },
          },
        },
        {
          tag: {
            connectOrCreate: {
              where: { userId_name: { userId: "user-1", name: "auth" } },
              create: { name: "auth", userId: "user-1" },
            },
          },
        },
      ],
    });
  });

  it("creates no links for no tags", () => {
    expect(toTagLinks("user-1", [])).toEqual({ create: [] });
  });
});

const CREATED_AT = new Date("2026-01-15T10:00:00Z");
const UPDATED_AT = new Date("2026-01-16T10:00:00Z");

const ITEM_ROW = {
  id: "item-1",
  title: "useAuth Hook",
  description: "Custom auth hook",
  contentType: "TEXT",
  content: "export function useAuth() {}",
  language: "typescript",
  url: null,
  fileName: null,
  fileSize: null,
  fileMimeType: null,
  isPinned: true,
  isFavorite: false,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  itemType: { id: "t1", name: "Snippet", slug: "snippets", icon: "Code", color: "#3b82f6" },
  tags: [{ tag: { name: "react" } }, { tag: { name: "auth" } }],
  collections: [{ collection: { id: "c1", name: "React Patterns" } }],
};

describe("getItemDetail", () => {
  it("scopes the lookup to the user in a single joined query", async () => {
    findFirst.mockResolvedValue(null);
    await getItemDetail("user-1", "item-1");
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1", userId: "user-1" },
        relationLoadStrategy: "join",
      })
    );
  });

  it("returns null when the item is missing or not the user's", async () => {
    findFirst.mockResolvedValue(null);
    await expect(getItemDetail("user-1", "item-1")).resolves.toBeNull();
  });

  it("maps the row to an item detail", async () => {
    findFirst.mockResolvedValue(ITEM_ROW as never);
    await expect(getItemDetail("user-1", "item-1")).resolves.toEqual({
      id: "item-1",
      title: "useAuth Hook",
      description: "Custom auth hook",
      isPinned: true,
      isFavorite: false,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      tags: ["react", "auth"],
      type: ITEM_ROW.itemType,
      contentType: "TEXT",
      content: "export function useAuth() {}",
      language: "typescript",
      url: null,
      fileName: null,
      fileSize: null,
      fileMimeType: null,
      copyText: "export function useAuth() {}",
      collections: [{ id: "c1", name: "React Patterns" }],
    });
  });

  it("copies a link's URL, and nothing for files or empty content", async () => {
    findFirst.mockResolvedValue({
      ...ITEM_ROW,
      contentType: "URL",
      content: null,
      url: "https://example.com",
    } as never);
    await expect(getItemDetail("user-1", "item-1")).resolves.toMatchObject({
      copyText: "https://example.com",
    });

    findFirst.mockResolvedValue({ ...ITEM_ROW, contentType: "FILE", content: null } as never);
    await expect(getItemDetail("user-1", "item-1")).resolves.toMatchObject({ copyText: null });

    findFirst.mockResolvedValue({ ...ITEM_ROW, content: "" } as never);
    await expect(getItemDetail("user-1", "item-1")).resolves.toMatchObject({ copyText: null });
  });
});

describe("updateItem", () => {
  const DATA = {
    title: "useAuth Hook",
    description: null,
    content: "export function useAuth() {}",
    language: "typescript",
    url: "https://example.com",
    tags: ["react", "auth"],
  };

  beforeEach(() => {
    // Batch transactions receive the queries' promises, so resolve them in order
    vi.mocked(prisma.$transaction).mockImplementation(
      (queries) => Promise.all(queries as unknown as Promise<unknown>[]) as never
    );
  });

  function updateArgs() {
    return update.mock.calls[0][0];
  }

  it("returns null without updating when the item is missing or not the user's", async () => {
    findFirst.mockResolvedValue(null);
    await expect(updateItem("user-1", "item-1", DATA)).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item-1", userId: "user-1" } })
    );
    expect(update).not.toHaveBeenCalled();
    expect(deleteTagLinks).not.toHaveBeenCalled();
  });

  it("scopes the update to the user and returns the updated detail", async () => {
    findFirst.mockResolvedValue({ contentType: "TEXT" } as never);
    update.mockResolvedValue(ITEM_ROW as never);
    const result = await updateItem("user-1", "item-1", DATA);
    expect(updateArgs().where).toEqual({ id: "item-1", userId: "user-1" });
    expect(result).toMatchObject({ id: "item-1", tags: ["react", "auth"], updatedAt: UPDATED_AT });
  });

  it("writes content and language but not the URL for text items", async () => {
    findFirst.mockResolvedValue({ contentType: "TEXT" } as never);
    update.mockResolvedValue(ITEM_ROW as never);
    await updateItem("user-1", "item-1", DATA);
    expect(updateArgs().data).toMatchObject({
      title: "useAuth Hook",
      description: null,
      content: DATA.content,
      language: "typescript",
      url: undefined,
    });
  });

  it("writes the URL but not content or language for link items", async () => {
    findFirst.mockResolvedValue({ contentType: "URL" } as never);
    update.mockResolvedValue(ITEM_ROW as never);
    await updateItem("user-1", "item-1", DATA);
    expect(updateArgs().data).toMatchObject({
      content: undefined,
      language: undefined,
      url: "https://example.com",
    });
  });

  it("replaces the tags, connecting or creating each one for the user", async () => {
    findFirst.mockResolvedValue({ contentType: "TEXT" } as never);
    update.mockResolvedValue(ITEM_ROW as never);
    await updateItem("user-1", "item-1", DATA);
    expect(deleteTagLinks).toHaveBeenCalledWith({
      where: { itemId: "item-1", item: { userId: "user-1" } },
    });
    expect(updateArgs().data.tags).toEqual({
      create: ["react", "auth"].map((name) => ({
        tag: {
          connectOrCreate: {
            where: { userId_name: { userId: "user-1", name } },
            create: { name, userId: "user-1" },
          },
        },
      })),
    });
  });

  it("leaves the collections unchanged when none were sent", async () => {
    findFirst.mockResolvedValue({ contentType: "TEXT" } as never);
    update.mockResolvedValue(ITEM_ROW as never);
    await updateItem("user-1", "item-1", DATA);
    expect(findCollections).not.toHaveBeenCalled();
    expect(deleteCollectionLinks).toHaveBeenCalledWith({ where: { itemId: { in: [] } } });
    expect(updateArgs().data.collections).toBeUndefined();
  });

  it("replaces the collections with the user's own collections only", async () => {
    findFirst.mockResolvedValue({ contentType: "TEXT" } as never);
    findCollections.mockResolvedValue([{ id: "c1" }] as never);
    update.mockResolvedValue(ITEM_ROW as never);
    await updateItem("user-1", "item-1", { ...DATA, collectionIds: ["c1", "other-users"] });
    expect(findCollections).toHaveBeenCalledWith({
      where: { id: { in: ["c1", "other-users"] }, userId: "user-1" },
      select: { id: true },
    });
    expect(deleteCollectionLinks).toHaveBeenCalledWith({
      where: { itemId: "item-1", item: { userId: "user-1" } },
    });
    expect(updateArgs().data.collections).toEqual(toCollectionLinks(["c1"]));
  });

  it("removes every collection when an empty list was sent", async () => {
    findFirst.mockResolvedValue({ contentType: "TEXT" } as never);
    update.mockResolvedValue(ITEM_ROW as never);
    await updateItem("user-1", "item-1", { ...DATA, collectionIds: [] });
    expect(findCollections).not.toHaveBeenCalled();
    expect(deleteCollectionLinks).toHaveBeenCalledWith({
      where: { itemId: "item-1", item: { userId: "user-1" } },
    });
    expect(updateArgs().data.collections).toEqual({ create: [] });
  });
});

describe("createItem", () => {
  const findType = vi.mocked(prisma.itemType.findFirst);
  const create = vi.mocked(prisma.item.create);

  const DATA = {
    typeSlug: "snippets" as const,
    title: "useAuth Hook",
    description: null,
    content: "export function useAuth() {}",
    language: "typescript",
    url: "https://example.com",
    tags: ["react", "auth"],
  };

  function createData() {
    return create.mock.calls[0][0].data;
  }

  it("looks up the system type by slug and returns null when it's missing", async () => {
    findType.mockResolvedValue(null);
    await expect(createItem("user-1", DATA)).resolves.toBeNull();
    expect(findType).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "snippets", isSystem: true, userId: null } })
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the item for the user with the type's content type and returns the detail", async () => {
    findType.mockResolvedValue({ id: "t1", contentType: "TEXT" } as never);
    create.mockResolvedValue(ITEM_ROW as never);
    const result = await createItem("user-1", DATA);
    expect(createData()).toMatchObject({
      title: "useAuth Hook",
      description: null,
      contentType: "TEXT",
      content: DATA.content,
      language: "typescript",
      url: null,
      userId: "user-1",
      itemTypeId: "t1",
    });
    expect(result).toMatchObject({ id: "item-1", tags: ["react", "auth"] });
  });

  it("drops the language for text types that don't take one", async () => {
    findType.mockResolvedValue({ id: "t2", contentType: "TEXT" } as never);
    create.mockResolvedValue(ITEM_ROW as never);
    await createItem("user-1", { ...DATA, typeSlug: "prompts" });
    expect(createData()).toMatchObject({ content: DATA.content, language: null });
  });

  it("saves only the URL for links", async () => {
    findType.mockResolvedValue({ id: "t5", contentType: "URL" } as never);
    create.mockResolvedValue(ITEM_ROW as never);
    await createItem("user-1", { ...DATA, typeSlug: "links" });
    expect(createData()).toMatchObject({
      contentType: "URL",
      content: null,
      language: null,
      url: "https://example.com",
    });
  });

  it("saves the uploaded file's key, name, size and type for file types", async () => {
    findType.mockResolvedValue({ id: "t6", contentType: "FILE" } as never);
    create.mockResolvedValue(ITEM_ROW as never);
    await createItem("user-1", { ...DATA, typeSlug: "files" }, {
      typeSlug: "files",
      key: "abc_notes.md",
      name: "notes.md",
      size: 1200,
      mimeType: "text/markdown",
    });
    expect(createData()).toMatchObject({
      contentType: "FILE",
      content: null,
      url: null,
      fileUrl: "abc_notes.md",
      fileName: "notes.md",
      fileSize: 1200,
      fileMimeType: "text/markdown",
    });
  });

  it("returns null without creating a file type that has no upload", async () => {
    findType.mockResolvedValue({ id: "t6", contentType: "FILE" } as never);
    await expect(createItem("user-1", { ...DATA, typeSlug: "files" })).resolves.toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("doesn't save file fields for other types", async () => {
    findType.mockResolvedValue({ id: "t1", contentType: "TEXT" } as never);
    create.mockResolvedValue(ITEM_ROW as never);
    await createItem("user-1", DATA, {
      typeSlug: "files",
      key: "abc_notes.md",
      name: "notes.md",
      size: 1200,
      mimeType: "text/markdown",
    });
    expect(createData()).toMatchObject({ fileUrl: null, fileName: null, fileSize: null });
  });

  it("connects or creates each tag for the user", async () => {
    findType.mockResolvedValue({ id: "t1", contentType: "TEXT" } as never);
    create.mockResolvedValue(ITEM_ROW as never);
    await createItem("user-1", DATA);
    expect(createData().tags).toEqual({
      create: ["react", "auth"].map((name) => ({
        tag: {
          connectOrCreate: {
            where: { userId_name: { userId: "user-1", name } },
            create: { name, userId: "user-1" },
          },
        },
      })),
    });
  });

  it("adds the item to the user's own chosen collections only", async () => {
    findType.mockResolvedValue({ id: "t1", contentType: "TEXT" } as never);
    findCollections.mockResolvedValue([{ id: "c1" }] as never);
    create.mockResolvedValue(ITEM_ROW as never);
    await createItem("user-1", { ...DATA, collectionIds: ["c1", "other-users"] });
    expect(findCollections).toHaveBeenCalledWith({
      where: { id: { in: ["c1", "other-users"] }, userId: "user-1" },
      select: { id: true },
    });
    expect(createData().collections).toEqual(toCollectionLinks(["c1"]));
  });

  it("adds no collections when none were chosen", async () => {
    findType.mockResolvedValue({ id: "t1", contentType: "TEXT" } as never);
    create.mockResolvedValue(ITEM_ROW as never);
    await createItem("user-1", DATA);
    expect(findCollections).not.toHaveBeenCalled();
    expect(createData().collections).toEqual({ create: [] });
  });
});

describe("deleteItem", () => {
  const deleteMany = vi.mocked(prisma.item.deleteMany);

  it("scopes the delete to the user and returns the item's file key", async () => {
    findFirst.mockResolvedValue({ fileUrl: "abc_photo.png" } as never);
    deleteMany.mockResolvedValue({ count: 1 });
    await expect(deleteItem("user-1", "item-1")).resolves.toEqual({ fileKey: "abc_photo.png" });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item-1", userId: "user-1" } })
    );
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "item-1", userId: "user-1" } });
  });

  it("returns a null file key for items without a file", async () => {
    findFirst.mockResolvedValue({ fileUrl: null } as never);
    deleteMany.mockResolvedValue({ count: 1 });
    await expect(deleteItem("user-1", "item-1")).resolves.toEqual({ fileKey: null });
  });

  it("returns null without deleting when the item is missing or not the user's", async () => {
    findFirst.mockResolvedValue(null);
    await expect(deleteItem("user-1", "item-1")).resolves.toBeNull();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("returns null when the item was deleted in the meantime", async () => {
    findFirst.mockResolvedValue({ fileUrl: null } as never);
    deleteMany.mockResolvedValue({ count: 0 });
    await expect(deleteItem("user-1", "item-1")).resolves.toBeNull();
  });
});

describe("getItemsByCollection", () => {
  const COLLECTION_WHERE = {
    userId: "user-1",
    collections: { some: { collectionId: "c1", collection: { userId: "user-1" } } },
  };

  it("returns one page of the user's items in the user's collection, pinned first", async () => {
    findMany.mockResolvedValue([ITEM_ROW] as never);
    count.mockResolvedValue(3);
    const result = await getItemsByCollection("user-1", "c1");
    expect(count).toHaveBeenCalledWith({ where: COLLECTION_WHERE });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: COLLECTION_WHERE,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        skip: 0,
        take: 21,
      })
    );
    expect(result).toEqual({
      items: [expect.objectContaining({ id: "item-1", tags: ["react", "auth"] })],
      total: 3,
      page: 1,
      totalPages: 1,
    });
  });
});

describe("getItemsByType", () => {
  it("skips the earlier pages of the user's items of the type", async () => {
    findMany.mockResolvedValue([ITEM_ROW] as never);
    count.mockResolvedValue(50);
    const result = await getItemsByType("user-1", "t1", 3);
    expect(count).toHaveBeenCalledWith({ where: { userId: "user-1", itemTypeId: "t1" } });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", itemTypeId: "t1" },
        skip: 42,
        take: 21,
      })
    );
    expect(result).toMatchObject({ total: 50, page: 3, totalPages: 3 });
  });

  it("falls back to the last page when the page is past the end", async () => {
    findMany.mockResolvedValueOnce([] as never).mockResolvedValueOnce([ITEM_ROW] as never);
    count.mockResolvedValue(22);
    const result = await getItemsByType("user-1", "t1", 5);
    expect(findMany).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 21, take: 21 }));
    expect(result).toMatchObject({ total: 22, page: 2, totalPages: 2 });
    expect(result.items).toHaveLength(1);
  });
});

describe("getSearchItems", () => {
  it("returns all of the user's items, pinned first, with a preview instead of copy text", async () => {
    findMany.mockResolvedValue([ITEM_ROW] as never);
    const items = await getSearchItems("user-1");
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      })
    );
    expect(items).toEqual([
      expect.objectContaining({
        id: "item-1",
        tags: ["react", "auth"],
        contentPreview: "export function useAuth() {}",
      }),
    ]);
    expect(items[0]).not.toHaveProperty("copyText");
  });
});

describe("getItemFile", () => {
  it("scopes the lookup to the user's file items", async () => {
    findFirst.mockResolvedValue(null);
    await getItemFile("user-1", "item-1");
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1", userId: "user-1", contentType: "FILE" },
      })
    );
  });

  it("returns null when the item is missing, not the user's or has no file", async () => {
    findFirst.mockResolvedValue(null);
    await expect(getItemFile("user-1", "item-1")).resolves.toBeNull();
    findFirst.mockResolvedValue({ fileUrl: null, fileName: null, fileMimeType: null } as never);
    await expect(getItemFile("user-1", "item-1")).resolves.toBeNull();
  });

  it("returns the file's key, name and type with fallbacks", async () => {
    findFirst.mockResolvedValue({
      fileUrl: "abc_photo.png",
      fileName: "photo.png",
      fileMimeType: "image/png",
    } as never);
    await expect(getItemFile("user-1", "item-1")).resolves.toEqual({
      key: "abc_photo.png",
      name: "photo.png",
      mimeType: "image/png",
    });

    findFirst.mockResolvedValue({ fileUrl: "abc", fileName: null, fileMimeType: null } as never);
    await expect(getItemFile("user-1", "item-1")).resolves.toEqual({
      key: "abc",
      name: "download",
      mimeType: "application/octet-stream",
    });
  });
});
