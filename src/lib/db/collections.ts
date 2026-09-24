import { prisma } from "@/lib/db";
import type {
  CollectionItemType,
  CollectionStats,
  CollectionSummary,
} from "@/types/collections";

const TYPE_SELECT = {
  id: true,
  name: true,
  slug: true,
  icon: true,
  color: true,
} as const;

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

export async function getRecentCollections(
  userId: string,
  limit = 6
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      defaultType: { select: TYPE_SELECT },
      items: { select: { item: { select: { itemType: { select: TYPE_SELECT } } } } },
    },
  });

  return collections.map((collection) => {
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
  });
}

export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
