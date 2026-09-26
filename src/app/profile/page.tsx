import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountActions } from "@/components/profile/AccountActions";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { UsageStats } from "@/components/profile/UsageStats";
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
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">Your account and usage</p>
      </header>
      <ProfileInfo user={user} />
      <UsageStats stats={stats} />
      <AccountActions hasPassword={user.hasPassword} />
    </div>
  );
}
