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

// The header of a collection's page; its items are loaded separately
export interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
}

// A collection an item can be added to, for the item forms' picker
export interface CollectionOption {
  id: string;
  name: string;
}

export interface CollectionStats {
  total: number;
  favorites: number;
}
