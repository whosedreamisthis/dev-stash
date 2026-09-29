import { connection } from "next/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSidebarData } from "@/lib/db/sidebar";

// Shared by every app page, so the shell stays mounted between them and each
// page's loading skeleton shows as soon as a link is clicked
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Render per request so the sidebar reflects the current database state
  await connection();

  const sidebar = await getSidebarData();

  return <DashboardShell sidebar={sidebar}>{children}</DashboardShell>;
}
