import type { SidebarCollections } from "@/types/collections";
import type { SidebarItemType } from "@/types/items";

export interface SidebarUser {
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface SidebarData {
  user: SidebarUser | null;
  itemTypes: SidebarItemType[];
  collections: SidebarCollections;
}
