import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  LANGUAGE_TYPE_SLUGS,
  type CreateItemData,
  type UpdateItemData,
} from "@/lib/validations/items";
import type { UploadedFile } from "@/lib/upload-token";
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

const ITEM_DETAIL_INCLUDE = {
  ...ITEM_SUMMARY_INCLUDE,
  collections: {
    select: { collection: { select: { id: true, name: true } } },
    orderBy: { collection: { name: "asc" } },
  },
} satisfies Prisma.ItemInclude;

type ItemWithDetailRelations = Prisma.ItemGetPayload<{
  include: typeof ITEM_DETAIL_INCLUDE;
}>;

function toItemDetail(item: ItemWithDetailRelations): ItemDetail {
  return {
    ...toItemSummary(item),
    contentType: item.contentType,
    content: item.content,
    language: item.language,
    url: item.url,
    fileName: item.fileName,
    fileSize: item.fileSize,
    fileMimeType: item.fileMimeType,
    updatedAt: item.updatedAt,
    collections: item.collections.map(({ collection }) => collection),
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
    include: ITEM_DETAIL_INCLUDE,
  });

  return item ? toItemDetail(item) : null;
}

// Returns null for items that don't exist or belong to another user
export async function updateItem(
  userId: string,
  itemId: string,
  data: UpdateItemData
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { contentType: true },
  });
  if (!existing) return null;

  // Only the fields that belong to the item's content type are written
  const isText = existing.contentType === "TEXT";
  const isUrl = existing.contentType === "URL";

  // Old tag links are removed first in the same transaction, so saving the same
  // tags again doesn't collide with the links being replaced
  const [, item] = await prisma.$transaction([
    prisma.itemTag.deleteMany({ where: { itemId, item: { userId } } }),
    prisma.item.update({
      where: { id: itemId, userId },
      data: {
        title: data.title,
        description: data.description,
        content: isText ? data.content : undefined,
        language: isText ? data.language : undefined,
        url: isUrl ? data.url : undefined,
        tags: {
          create: data.tags.map((name) => ({
            tag: {
              connectOrCreate: {
                where: { userId_name: { userId, name } },
                create: { name, userId },
              },
            },
          })),
        },
      },
      include: ITEM_DETAIL_INCLUDE,
    }),
  ]);

  return toItemDetail(item);
}

// Returns null when the system type for the slug doesn't exist, or when a file
// type is created without an uploaded file
export async function createItem(
  userId: string,
  data: CreateItemData,
  file?: UploadedFile
): Promise<ItemDetail | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { slug: data.typeSlug, isSystem: true, userId: null },
    select: { id: true, contentType: true },
  });
  if (!itemType) return null;

  // Only the fields that belong to the type's content type are saved
  const isText = itemType.contentType === "TEXT";
  const isUrl = itemType.contentType === "URL";
  const isFile = itemType.contentType === "FILE";
  if (isFile && !file) return null;

  const item = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      contentType: itemType.contentType,
      content: isText ? data.content : null,
      language: LANGUAGE_TYPE_SLUGS.has(data.typeSlug) ? data.language : null,
      url: isUrl ? data.url : null,
      // fileUrl holds the UploadThing key; files are served through /api/items/[id]/file
      fileUrl: isFile ? file?.key : null,
      fileName: isFile ? file?.name : null,
      fileSize: isFile ? file?.size : null,
      fileMimeType: isFile ? file?.mimeType : null,
      userId,
      itemTypeId: itemType.id,
      tags: {
        create: data.tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { userId_name: { userId, name } },
              create: { name, userId },
            },
          },
        })),
      },
    },
    include: ITEM_DETAIL_INCLUDE,
  });

  return toItemDetail(item);
}

// Returns null for items that don't exist, belong to another user or have no file
export async function getItemFile(
  userId: string,
  itemId: string
): Promise<{ key: string; name: string; mimeType: string } | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId, contentType: "FILE" },
    select: { fileUrl: true, fileName: true, fileMimeType: true },
  });
  if (!item?.fileUrl) return null;

  return {
    key: item.fileUrl,
    name: item.fileName ?? "download",
    mimeType: item.fileMimeType ?? "application/octet-stream",
  };
}

// Returns null for items that don't exist or belong to another user, otherwise
// the deleted item's UploadThing key so its file can be removed too.
// Tag and collection links are removed by the cascades on the join tables.
export async function deleteItem(
  userId: string,
  itemId: string
): Promise<{ fileKey: string | null } | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { fileUrl: true },
  });
  if (!item) return null;

  const { count } = await prisma.item.deleteMany({ where: { id: itemId, userId } });
  return count > 0 ? { fileKey: item.fileUrl } : null;
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
