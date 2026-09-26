import { auth } from "@/auth";
import { getSidebarCollections } from "@/lib/db/collections";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getDemoUser } from "@/lib/db/users";
import type { SidebarData } from "@/types/sidebar";

// Shared by every layout that renders the dashboard shell
export async function getSidebarData(): Promise<SidebarData> {
  const [session, demoUser] = await Promise.all([auth(), getDemoUser()]);
  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }
    : null;

  if (!demoUser) {
    return { user, itemTypes: [], collections: { favorites: [], recent: [] } };
  }

  // Sidebar data still comes from the demo user until queries use the session user
  const [itemTypes, collections] = await Promise.all([
    getSidebarItemTypes(demoUser.id),
    getSidebarCollections(demoUser.id),
  ]);

  return { user, itemTypes, collections };
}
