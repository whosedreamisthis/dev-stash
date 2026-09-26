import type { SidebarItemType } from "@/types/items";

export interface ProfileUser {
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  // True for email/password accounts; the hash itself never leaves the server
  hasPassword: boolean;
}

export interface ProfileStats {
  totalItems: number;
  totalCollections: number;
  itemTypes: SidebarItemType[];
}
