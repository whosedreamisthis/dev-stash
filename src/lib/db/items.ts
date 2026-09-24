import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { ItemStats, ItemSummary } from "@/types/items";

const ITEM_SUMMARY_INCLUDE = {
  itemType: {
    select: { id: true, name: true, slug: true, icon: true, color: true },
  },
  tags: { select: { tag: { select: { name: true } } } },
} satisfies Prisma.ItemInclude;

type ItemWithRelations = Prisma.ItemGetPayload<{
  include: typeof ITEM_SUMMARY_INCLUDE;
}>;

function toItemSummary(item: ItemWithRelations): ItemSummary {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    createdAt: item.createdAt,
    tags: item.tags.map(({ tag }) => tag.name),
    type: item.itemType,
  };
}

export async function getPinnedItems(userId: string): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: "desc" },
    include: ITEM_SUMMARY_INCLUDE,
  });

  return items.map(toItemSummary);
}

export async function getRecentItems(
  userId: string,
  limit = 10
): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    // Items that were never opened fall back to creation order
    orderBy: [
      { lastUsedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    take: limit,
    include: ITEM_SUMMARY_INCLUDE,
  });

  return items.map(toItemSummary);
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
