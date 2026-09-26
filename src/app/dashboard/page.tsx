import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Clock, Pin } from "lucide-react";
import { auth } from "@/auth";
import { ItemList } from "@/components/dashboard/ItemList";
import { RecentCollections } from "@/components/dashboard/RecentCollections";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { getCollectionStats, getRecentCollections } from "@/lib/db/collections";
import { getItemStats, getPinnedItems, getRecentItems } from "@/lib/db/items";

async function getDashboardData(userId: string) {
  const [collections, collectionStats, pinnedItems, recentItems, itemStats] =
    await Promise.all([
      getRecentCollections(userId),
      getCollectionStats(userId),
      getPinnedItems(userId),
      getRecentItems(userId),
      getItemStats(userId),
    ]);

  return { collections, collectionStats, pinnedItems, recentItems, itemStats };
}

export default async function DashboardPage() {
  // Render per request so the dashboard reflects the current database state
  await connection();

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in?callbackUrl=/dashboard");

  const data = await getDashboardData(userId);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Your developer knowledge hub</p>
      </header>
      <StatsCards
        itemStats={data.itemStats}
        collectionStats={data.collectionStats}
      />
      <RecentCollections collections={data.collections} />
      <ItemList title="Pinned" icon={Pin} items={data.pinnedItems} />
      <ItemList title="Recent" icon={Clock} items={data.recentItems} />
    </div>
  );
}
