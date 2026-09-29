import { connection } from "next/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSidebarData } from "@/lib/db/sidebar";

export default async function UpgradeLayout({ children }: LayoutProps<"/upgrade">) {
  // Render per request so the sidebar reflects the current database state
  await connection();

  const sidebar = await getSidebarData();

  return <DashboardShell sidebar={sidebar}>{children}</DashboardShell>;
}
