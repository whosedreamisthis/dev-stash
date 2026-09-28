import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  createItem,
  deleteItem,
  getItemDetail,
  getItemFile,
  updateItem,
} from "@/lib/db/items";

vi.mock("@/lib/db", () => ({
  prisma: {
    item: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    itemType: { findFirst: vi.fn() },
    itemTag: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const findFirst = vi.mocked(prisma.item.findFirst);
const update = vi.mocked(prisma.item.update);
const deleteTagLinks = vi.mocked(prisma.itemTag.deleteMany);

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
      collections: [{ id: "c1", name: "React Patterns" }],
    });
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
