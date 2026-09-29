import type { EditorPreferences } from "@/lib/validations/editor-preferences";
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
  // Loaded with the sidebar because every page in the shell can open a code editor
  editorPreferences: EditorPreferences;
}
