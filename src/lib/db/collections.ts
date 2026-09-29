import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { COLLECTIONS_PER_PAGE, DASHBOARD_COLLECTIONS_LIMIT, paginate } from "@/lib/pagination";
import type { CreateCollectionData, UpdateCollectionData } from "@/lib/validations/collections";
import type { FavoriteCollection } from "@/types/favorites";
import type { PaginatedResult } from "@/types/pagination";
import type {
  CollectionDetail,
  CollectionItemType,
  CollectionOption,
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
  limit = DASHBOARD_COLLECTIONS_LIMIT
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: COLLECTION_SUMMARY_INCLUDE,
  });

  return collections.map(toCollectionSummary);
}

// Most recently favorited first; updatedAt stands in for the time it was favorited
export async function getFavoriteCollections(userId: string): Promise<FavoriteCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite: true },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    include: COLLECTION_SUMMARY_INCLUDE,
  });

  return collections.map((collection) => ({
    ...toCollectionSummary(collection),
    updatedAt: collection.updatedAt,
  }));
}

// All of the user's collections for the command palette, favorites first
export async function getSearchCollections(userId: string): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    include: COLLECTION_SUMMARY_INCLUDE,
  });

  return collections.map(toCollectionSummary);
}

// The id breaks ties so no collection shows up on two pages
export function getCollections(
  userId: string,
  page = 1
): Promise<PaginatedResult<CollectionSummary>> {
  const where = { userId };

  return paginate(
    page,
    COLLECTIONS_PER_PAGE,
    () => prisma.collection.count({ where }),
    async (range) => {
      const collections = await prisma.collection.findMany({
        where,
        orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
        ...range,
        include: COLLECTION_SUMMARY_INCLUDE,
      });
      return collections.map(toCollectionSummary);
    }
  );
}

// Returns null for collections that don't exist or belong to another user
export async function getCollectionById(
  userId: string,
  collectionId: string
): Promise<CollectionDetail | null> {
  return prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true, name: true, description: true, isFavorite: true },
  });
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

export async function getCollectionOptions(userId: string): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function createCollection(
  userId: string,
  data: CreateCollectionData
): Promise<CollectionSummary> {
  const collection = await prisma.collection.create({
    data: { name: data.name, description: data.description, userId },
    include: COLLECTION_SUMMARY_INCLUDE,
  });

  return toCollectionSummary(collection);
}

// Returns null for collections that don't exist or belong to another user
export async function updateCollection(
  userId: string,
  collectionId: string,
  data: UpdateCollectionData
): Promise<CollectionSummary | null> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });
  if (!existing) return null;

  const collection = await prisma.collection.update({
    where: { id: collectionId },
    data: { name: data.name, description: data.description },
    include: COLLECTION_SUMMARY_INCLUDE,
  });

  return toCollectionSummary(collection);
}

// Deletes the collection and its item links; the items themselves are kept
export async function deleteCollection(userId: string, collectionId: string): Promise<boolean> {
  const { count } = await prisma.collection.deleteMany({ where: { id: collectionId, userId } });
  return count > 0;
}
