import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { getItemDetail } from "@/lib/db/items";

vi.mock("@/lib/db", () => ({ prisma: { item: { findFirst: vi.fn() } } }));

const findFirst = vi.mocked(prisma.item.findFirst);

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
