import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createCollection, getCollectionOptions } from "@/lib/db/collections";

vi.mock("@/lib/db", () => ({
  prisma: { collection: { create: vi.fn(), findMany: vi.fn() } },
}));

const create = vi.mocked(prisma.collection.create);

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
