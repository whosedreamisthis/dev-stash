import { Star } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

const SECTIONS = ["items", "collections"] as const;
const ROW_COUNT = 5;

// Shown instantly on navigation, before the server has loaded the favorites
export default function FavoritesLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8" aria-busy="true">
      <PageHeader
        title="Favorites"
        icon={<Star className="size-7 shrink-0 fill-yellow-400 text-yellow-400" />}
      />
      {SECTIONS.map((section) => (
        <section key={section} aria-label={`Loading favorite ${section}`}>
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: ROW_COUNT }, (_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
