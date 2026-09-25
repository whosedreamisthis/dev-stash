import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type {
  CollectionItemType,
  CollectionStats,
  CollectionSummary,
  SidebarCollections,
} from "@/types/collections";

const TYPE_SELECT = {
  id: true,
  name: true,
  slug: true,
  icon: true,
  color: true,
} as const;

const COLLECTION_SUMMARY_INCLUDE = {
  defaultType: { select: TYPE_SELECT },
  items: { select: { item: { select: { itemType: { select: TYPE_SELECT } } } } },
} satisfies Prisma.CollectionInclude;

type CollectionWithRelations = Prisma.CollectionGetPayload<{
  include: typeof COLLECTION_SUMMARY_INCLUDE;
}>;

function rankTypesByUsage(types: CollectionItemType[]): CollectionItemType[] {
  const counts = new Map<string, { type: CollectionItemType; count: number }>();

  for (const type of types) {
    const entry = counts.get(type.id);
    if (entry) entry.count++;
    else counts.set(type.id, { type, count: 1 });
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map(({ type }) => type);
}

function toCollectionSummary(
  collection: CollectionWithRelations
): CollectionSummary {
  const types = rankTypesByUsage(
    collection.items.map(({ item }) => item.itemType)
  );

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: collection.items.length,
    types,
    mainType: types[0] ?? collection.defaultType,
  };
}

export async function getRecentCollections(
  userId: string,
  limit = 6
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: COLLECTION_SUMMARY_INCLUDE,
  });

  return collections.map(toCollectionSummary);
}

export async function getSidebarCollections(
  userId: string,
  recentLimit = 5
): Promise<SidebarCollections> {
  const [favorites, recent] = await Promise.all([
    prisma.collection.findMany({
      where: { userId, isFavorite: true },
      orderBy: { name: "asc" },
      include: COLLECTION_SUMMARY_INCLUDE,
    }),
    prisma.collection.findMany({
      where: { userId, isFavorite: false },
      orderBy: { updatedAt: "desc" },
      take: recentLimit,
      include: COLLECTION_SUMMARY_INCLUDE,
    }),
  ]);

  return {
    favorites: favorites.map(toCollectionSummary),
    recent: recent.map(toCollectionSummary),
  };
}

export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
