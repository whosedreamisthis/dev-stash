import { PREVIEW_ITEMS, PREVIEW_TYPES } from "@/lib/homepage-content";
import { ITEM_TYPE_BG_COLORS, ITEM_TYPE_BORDER_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";

// Decorative mini dashboard: type sidebar and a grid of type-colored item cards
export function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="grid h-80 overflow-hidden rounded-xl border bg-background min-[420px]:grid-cols-[7.5rem_1fr]"
    >
      <aside className="hidden border-r bg-sidebar p-3 min-[420px]:block">
        <div className="mb-3.5 flex items-center gap-1.5 text-xs font-bold">
          <span className="size-3 rounded bg-violet-600" />
          DevStash
        </div>
        <ul>
          {PREVIEW_TYPES.map((type, i) => (
            <li
              key={type.slug}
              className={cn(
                "flex items-center gap-2 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground",
                i === 0 && "bg-muted text-foreground"
              )}
            >
              <span className={cn("size-2 rounded-sm", ITEM_TYPE_BG_COLORS[type.slug])} />
              {type.name}
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0 p-3">
        <div className="mb-3 flex items-center justify-between rounded-md border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground">
          Search…
          <kbd className="rounded border px-1 font-mono text-[10px]">⌘K</kbd>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PREVIEW_ITEMS.map((item) => (
            <div
              key={item.name}
              className={cn(
                "flex flex-col gap-1.5 rounded-lg border bg-card px-2.5 pt-2 pb-2.5 transition-colors",
                ITEM_TYPE_BORDER_COLORS[item.slug]
              )}
            >
              <span className="truncate text-[11px] font-semibold">{item.name}</span>
              <span className="h-1.5 rounded-full bg-muted" />
              <span className="h-1.5 w-3/5 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
