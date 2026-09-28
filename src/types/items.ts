import type { CollectionItemType } from "@/types/collections";

export interface ItemSummary {
  id: string;
  title: string;
  description: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: Date;
  tags: string[];
  type: CollectionItemType;
  // Null for items without an uploaded file
  fileName: string | null;
  fileSize: number | null;
  // What the copy buttons copy: the content, or a link's URL; null for files
  copyText: string | null;
}

export interface ItemDetail extends ItemSummary {
  contentType: "TEXT" | "URL" | "FILE";
  content: string | null;
  language: string | null;
  url: string | null;
  fileMimeType: string | null;
  updatedAt: Date;
  collections: { id: string; name: string }[];
}

export interface SidebarItemType extends CollectionItemType {
  // Number of the user's items of this type
  count: number;
  isProOnly: boolean;
}

export interface ItemStats {
  total: number;
  favorites: number;
}
