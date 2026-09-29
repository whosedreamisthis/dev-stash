import { Skeleton } from "@/components/ui/skeleton";

// Shown instantly on navigation, before the server has loaded the settings
export default function SettingsLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8" aria-busy="true">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your editor, plan and account</p>
      </header>
      <Skeleton className="h-80 rounded-xl" aria-label="Loading editor settings" />
      <Skeleton className="h-48 rounded-xl" aria-label="Loading billing" />
      <Skeleton className="h-40 rounded-xl" aria-label="Loading account actions" />
    </div>
  );
}
