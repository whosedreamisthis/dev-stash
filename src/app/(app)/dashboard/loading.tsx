import { LayoutDashboard } from "lucide-react";
import { ItemGridSkeleton } from "@/components/items/ItemGridSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { COLLECTION_GRID_CLASS } from "@/lib/item-grid";

const STAT_COUNT = 4;
const COLLECTION_COUNT = 6;

// Shown instantly on navigation, before the server has loaded the dashboard
export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8" aria-busy="true">
      <PageHeader
        title="Dashboard"
        icon={<LayoutDashboard className="size-7 shrink-0 text-muted-foreground" />}
        description="Your developer knowledge hub"
      />
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Loading stats">
        {Array.from({ length: STAT_COUNT }, (_, i) => (
          <Skeleton key={i} className="h-[106px] rounded-xl" />
        ))}
      </section>
      <section aria-label="Loading collections">
        <h2 className="mb-4 text-xl font-semibold">Collections</h2>
        <div className={COLLECTION_GRID_CLASS}>
          {Array.from({ length: COLLECTION_COUNT }, (_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-xl" />
          ))}
        </div>
      </section>
      <ItemGridSkeleton />
    </div>
  );
}
