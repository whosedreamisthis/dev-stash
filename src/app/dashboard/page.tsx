import { Clock, Pin } from "lucide-react";
import { ItemList } from "@/components/dashboard/ItemList";
import { RecentCollections } from "@/components/dashboard/RecentCollections";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { items } from "@/lib/mock-data";

const RECENT_ITEMS_LIMIT = 10;

export default function DashboardPage() {
  const pinnedItems = items.filter((item) => item.isPinned);
  const recentItems = [...items]
    .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt))
    .slice(0, RECENT_ITEMS_LIMIT);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Your developer knowledge hub</p>
      </header>
      <StatsCards />
      <RecentCollections />
      <ItemList title="Pinned" icon={Pin} items={pinnedItems} />
      <ItemList title="Recent" icon={Clock} items={recentItems} />
    </div>
  );
}
