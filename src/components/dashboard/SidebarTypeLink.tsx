import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SIDEBAR_LINK_CLASS } from "@/components/dashboard/SidebarSection";
import { ITEM_TYPE_ICONS, ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
import type { SidebarItemType } from "@/types/items";

interface SidebarTypeLinkProps {
  type: SidebarItemType;
  isActive: boolean;
  onNavigate?: () => void;
}

// Links to the type's items page, with a PRO badge for Pro-only types and the item count
export function SidebarTypeLink({ type, isActive, onNavigate }: SidebarTypeLinkProps) {
  const Icon = ITEM_TYPE_ICONS[type.icon];

  return (
    <Link
      href={`/items/${type.slug}`}
      onClick={onNavigate}
      className={cn(SIDEBAR_LINK_CLASS, isActive && "bg-sidebar-accent")}
    >
      {Icon && <Icon className={cn("size-4", ITEM_TYPE_TEXT_COLORS[type.slug])} />}
      <span className="flex-1 capitalize">{type.slug}</span>
      {type.isProOnly && (
        <Badge
          variant="outline"
          className="h-4 px-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground"
        >
          PRO
        </Badge>
      )}
      <span className="text-xs text-muted-foreground">{type.count}</span>
    </Link>
  );
}
