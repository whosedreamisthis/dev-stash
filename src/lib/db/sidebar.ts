import { auth } from "@/auth";
import { getSidebarCollections } from "@/lib/db/collections";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getEditorPreferences } from "@/lib/db/users";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";
import { hasProAccess } from "@/lib/usage-limits";
import type { SidebarData } from "@/types/sidebar";

// Shared by every layout that renders the dashboard shell
export async function getSidebarData(): Promise<SidebarData> {
  const session = await auth();
  const userId = session?.user?.id;
  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }
    : null;

  if (!userId) {
    return {
      user,
      itemTypes: [],
      collections: { favorites: [], recent: [] },
      editorPreferences: DEFAULT_EDITOR_PREFERENCES,
      hasProAccess: false,
      isDemo: false,
    };
  }

  const [itemTypes, collections, editorPreferences] = await Promise.all([
    getSidebarItemTypes(userId),
    getSidebarCollections(userId),
    getEditorPreferences(userId),
  ]);

  return {
    user,
    itemTypes,
    collections,
    editorPreferences,
    hasProAccess: hasProAccess({ isPro: session?.user?.isPro ?? false }),
    isDemo: session?.user?.isDemo ?? false,
  };
}
