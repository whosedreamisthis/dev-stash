import { FolderOpen, Layers } from "lucide-react";
import { ITEM_TYPE_ICONS, ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
import type { ProfileStats } from "@/types/profile";

interface UsageStatsProps {
  stats: ProfileStats;
}

export function UsageStats({ stats }: UsageStatsProps) {
  const totals = [
    { label: "Total items", value: stats.totalItems, icon: Layers },
    { label: "Total collections", value: stats.totalCollections, icon: FolderOpen },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Usage</h2>
      <div className="grid grid-cols-2 gap-4">
        {totals.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {label}
              <Icon className="size-4" />
            </div>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm text-muted-foreground">Items by type</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {stats.itemTypes.map((type) => {
            const Icon = ITEM_TYPE_ICONS[type.icon] ?? Layers;
            return (
              <li
                key={type.id}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
              >
                <Icon className={cn("size-4", ITEM_TYPE_TEXT_COLORS[type.slug])} />
                <span className="flex-1 capitalize">{type.slug}</span>
                <span className="font-medium tabular-nums">{type.count}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
