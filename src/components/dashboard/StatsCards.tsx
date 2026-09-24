import { FolderOpen, Layers, Star, type LucideIcon } from "lucide-react";
import { collections, items } from "@/lib/mock-data";

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
}

const stats: Stat[] = [
  { label: "Items", value: items.length, icon: Layers },
  { label: "Collections", value: collections.length, icon: FolderOpen },
  {
    label: "Favorite items",
    value: items.filter((item) => item.isFavorite).length,
    icon: Star,
  },
  {
    label: "Favorite collections",
    value: collections.filter((collection) => collection.isFavorite).length,
    icon: Star,
  },
];

export function StatsCards() {
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
