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
}

export interface ItemDetail extends ItemSummary {
  contentType: "TEXT" | "URL" | "FILE";
  content: string | null;
  language: string | null;
  url: string | null;
  fileName: string | null;
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
