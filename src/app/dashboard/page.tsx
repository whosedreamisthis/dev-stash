import { connection } from "next/server";
import { Clock, Pin } from "lucide-react";
import { ItemList } from "@/components/dashboard/ItemList";
import { RecentCollections } from "@/components/dashboard/RecentCollections";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { getCollectionStats, getRecentCollections } from "@/lib/db/collections";
import { getDemoUser } from "@/lib/db/users";
import { items } from "@/lib/mock-data";

const RECENT_ITEMS_LIMIT = 10;

export default async function DashboardPage() {
  // Render per request so the dashboard reflects the current database state
  await connection();

  const user = await getDemoUser();
  const [collections, collectionStats] = user
    ? await Promise.all([
        getRecentCollections(user.id),
        getCollectionStats(user.id),
      ])
    : [[], { total: 0, favorites: 0 }];

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
      <StatsCards collectionStats={collectionStats} />
      <RecentCollections collections={collections} />
      <ItemList title="Pinned" icon={Pin} items={pinnedItems} />
      <ItemList title="Recent" icon={Clock} items={recentItems} />
    </div>
  );
}
