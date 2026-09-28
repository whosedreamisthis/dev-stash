import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createCollection } from "@/lib/db/collections";

vi.mock("@/lib/db", () => ({
  prisma: { collection: { create: vi.fn() } },
}));

const create = vi.mocked(prisma.collection.create);

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
