import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { CollectionItemType } from "@/types/collections";
import type {
  ItemDetail,
  ItemStats,
  ItemSummary,
  SidebarItemType,
} from "@/types/items";

const ITEM_TYPE_SELECT = {
  id: true,
  name: true,
  slug: true,
  icon: true,
  color: true,
} satisfies Prisma.ItemTypeSelect;

const ITEM_SUMMARY_INCLUDE = {
  itemType: { select: ITEM_TYPE_SELECT },
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

// Returns null for items that don't exist or belong to another user
export async function getItemDetail(
  userId: string,
  itemId: string
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    // One round trip to the database instead of one query per relation
    relationLoadStrategy: "join",
    include: {
      ...ITEM_SUMMARY_INCLUDE,
      collections: {
        select: { collection: { select: { id: true, name: true } } },
        orderBy: { collection: { name: "asc" } },
      },
    },
  });
  if (!item) return null;

  return {
    ...toItemSummary(item),
    contentType: item.contentType,
    content: item.content,
    language: item.language,
    url: item.url,
    fileName: item.fileName,
    updatedAt: item.updatedAt,
    collections: item.collections.map(({ collection }) => collection),
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

export async function getItemTypeBySlug(
  userId: string,
  slug: string
): Promise<CollectionItemType | null> {
  return prisma.itemType.findFirst({
    // System types have no owner; custom types belong to the user
    where: { slug, OR: [{ userId: null }, { userId }] },
    select: ITEM_TYPE_SELECT,
  });
}

export async function getItemsByType(
  userId: string,
  itemTypeId: string
): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { userId, itemTypeId },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
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

export async function getSidebarItemTypes(
  userId: string
): Promise<SidebarItemType[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    // System types are seeded in display order
    orderBy: { createdAt: "asc" },
    select: {
      ...ITEM_TYPE_SELECT,
      isProOnly: true,
      _count: { select: { items: { where: { userId } } } },
    },
  });

  return types.map(({ _count, ...type }) => ({ ...type, count: _count.items }));
}
