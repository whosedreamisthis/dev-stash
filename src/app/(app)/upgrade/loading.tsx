import { Skeleton } from "@/components/ui/skeleton";

const PLAN_COUNT = 2;

// Shown instantly on navigation, before the server has checked the user's plan
export default function UpgradeLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 py-4" aria-busy="true">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Upgrade to Pro</h1>
        <p className="mt-2 text-muted-foreground">
          Unlimited items and collections, file and image uploads, and AI features.
        </p>
      </header>
      <div className="mx-auto grid w-full max-w-3xl gap-6 md:grid-cols-2" aria-label="Loading plans">
        {Array.from({ length: PLAN_COUNT }, (_, i) => (
          <Skeleton key={i} className="h-[420px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
