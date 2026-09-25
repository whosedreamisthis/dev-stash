import { connection } from "next/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSidebarCollections } from "@/lib/db/collections";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getDemoUser } from "@/lib/db/users";
import type { SidebarData } from "@/types/sidebar";

async function getSidebarData(): Promise<SidebarData> {
  const user = await getDemoUser();
  if (!user) {
    return { user: null, itemTypes: [], collections: { favorites: [], recent: [] } };
  }

  const [itemTypes, collections] = await Promise.all([
    getSidebarItemTypes(user.id),
    getSidebarCollections(user.id),
  ]);

  return {
    user: { name: user.name, email: user.email, image: user.image },
    itemTypes,
    collections,
  };
}

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  // Render per request so the sidebar reflects the current database state
  await connection();

  const sidebar = await getSidebarData();

  return <DashboardShell sidebar={sidebar}>{children}</DashboardShell>;
}
