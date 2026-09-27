import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { deleteItem, getItemDetail, updateItem } from "@/lib/db/items";

vi.mock("@/lib/db", () => ({
  prisma: {
    item: { findFirst: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
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

describe("deleteItem", () => {
  const deleteMany = vi.mocked(prisma.item.deleteMany);

  it("scopes the delete to the user and reports success", async () => {
    deleteMany.mockResolvedValue({ count: 1 });
    await expect(deleteItem("user-1", "item-1")).resolves.toBe(true);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "item-1", userId: "user-1" } });
  });

  it("returns false when the item is missing or not the user's", async () => {
    deleteMany.mockResolvedValue({ count: 0 });
    await expect(deleteItem("user-1", "item-1")).resolves.toBe(false);
  });
});
