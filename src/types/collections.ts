export interface CollectionItemType {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  // Types in the collection, most-used first
  types: CollectionItemType[];
  // Most-used type, or the default type when the collection is empty
  mainType: CollectionItemType | null;
}

export interface SidebarCollections {
  favorites: CollectionSummary[];
  recent: CollectionSummary[];
}

export interface CollectionStats {
  total: number;
  favorites: number;
}
