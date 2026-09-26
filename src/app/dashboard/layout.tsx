import { connection } from "next/server";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSidebarCollections } from "@/lib/db/collections";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getDemoUser } from "@/lib/db/users";
import type { SidebarData } from "@/types/sidebar";

async function getSidebarData(): Promise<SidebarData> {
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

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  // Render per request so the sidebar reflects the current database state
  await connection();

  const sidebar = await getSidebarData();

  return <DashboardShell sidebar={sidebar}>{children}</DashboardShell>;
}
