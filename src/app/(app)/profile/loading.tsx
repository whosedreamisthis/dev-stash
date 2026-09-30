import { User } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

// Shown instantly on navigation, before the server has loaded the profile
export default function ProfileLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8" aria-busy="true">
      <PageHeader
        title="Profile"
        icon={<User className="size-7 shrink-0 text-muted-foreground" />}
        description="Your account and usage"
      />
      <Skeleton className="h-36 rounded-xl" aria-label="Loading account info" />
      <Skeleton className="h-64 rounded-xl" aria-label="Loading usage" />
    </div>
  );
}
