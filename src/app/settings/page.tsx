import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountActions } from "@/components/settings/AccountActions";
import { getProfileUser } from "@/lib/db/users";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in?callbackUrl=/settings");

  const user = await getProfileUser(userId);
  // The session can outlive a deleted account
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account</p>
      </header>
      <AccountActions hasPassword={user.hasPassword} />
    </div>
  );
}
