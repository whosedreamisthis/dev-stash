import { FolderOpen } from "lucide-react";
import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";

// Shared by the /collections page and its loading state
export function CollectionsHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <FolderOpen className="size-7 shrink-0 text-muted-foreground" />
        <h1 className="truncate text-3xl font-bold tracking-tight">Collections</h1>
      </div>
      <NewCollectionDialog />
    </header>
  );
}
