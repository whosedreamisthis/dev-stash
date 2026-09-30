import { redirect } from "next/navigation";
import { User } from "lucide-react";
import { auth } from "@/auth";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { UsageStats } from "@/components/profile/UsageStats";
import { PageHeader } from "@/components/shared/PageHeader";
import { getCollectionStats } from "@/lib/db/collections";
import { getItemStats, getSidebarItemTypes } from "@/lib/db/items";
import { getProfileUser } from "@/lib/db/users";
import type { ProfileStats } from "@/types/profile";

async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [itemStats, collectionStats, itemTypes] = await Promise.all([
    getItemStats(userId),
    getCollectionStats(userId),
    getSidebarItemTypes(userId),
  ]);

  return {
    totalItems: itemStats.total,
    totalCollections: collectionStats.total,
    itemTypes,
  };
}

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in?callbackUrl=/profile");

  const [user, stats] = await Promise.all([
    getProfileUser(userId),
    getProfileStats(userId),
  ]);
  // The session can outlive a deleted account
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Profile"
        icon={<User className="size-7 shrink-0 text-muted-foreground" />}
        description="Your account and usage"
      />
      <ProfileInfo user={user} />
      <UsageStats stats={stats} />
    </div>
  );
}
