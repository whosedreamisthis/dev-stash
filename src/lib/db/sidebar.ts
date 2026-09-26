import { auth } from "@/auth";
import { getSidebarCollections } from "@/lib/db/collections";
import { getSidebarItemTypes } from "@/lib/db/items";
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
    return { user, itemTypes: [], collections: { favorites: [], recent: [] } };
  }

  const [itemTypes, collections] = await Promise.all([
    getSidebarItemTypes(userId),
    getSidebarCollections(userId),
  ]);

  return { user, itemTypes, collections };
}
