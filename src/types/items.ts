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

export interface SidebarItemType extends CollectionItemType {
  // Number of the user's items of this type
  count: number;
}

export interface ItemStats {
  total: number;
  favorites: number;
}
