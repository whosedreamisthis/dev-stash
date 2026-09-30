import { FolderOpen } from "lucide-react";
import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { PageHeader } from "@/components/shared/PageHeader";

// Shared by the /collections page and its loading state
export function CollectionsHeader() {
  return (
    <PageHeader
      title="Collections"
      icon={<FolderOpen className="size-7 shrink-0 text-muted-foreground" />}
      action={<NewCollectionDialog />}
    />
  );
}
