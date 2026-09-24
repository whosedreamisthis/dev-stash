import { FolderOpen, Layers, Star, type LucideIcon } from "lucide-react";
import type { CollectionStats } from "@/types/collections";
import type { ItemStats } from "@/types/items";

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
}

interface StatsCardsProps {
  itemStats: ItemStats;
  collectionStats: CollectionStats;
}

export function StatsCards({ itemStats, collectionStats }: StatsCardsProps) {
  const stats: Stat[] = [
    { label: "Items", value: itemStats.total, icon: Layers },
    { label: "Collections", value: collectionStats.total, icon: FolderOpen },
    { label: "Favorite items", value: itemStats.favorites, icon: Star },
    {
      label: "Favorite collections",
      value: collectionStats.favorites,
      icon: Star,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {label}
            <Icon className="size-4" />
          </div>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
      ))}
    </section>
  );
}
