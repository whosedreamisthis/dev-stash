import { Skeleton } from "@/components/ui/skeleton";

// Shown instantly on navigation, before the server has loaded the profile
export default function ProfileLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8" aria-busy="true">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">Your account and usage</p>
      </header>
      <Skeleton className="h-36 rounded-xl" aria-label="Loading account info" />
      <Skeleton className="h-64 rounded-xl" aria-label="Loading usage" />
    </div>
  );
}
