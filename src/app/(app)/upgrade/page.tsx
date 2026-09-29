import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UpgradePlans } from "@/components/billing/UpgradePlans";
import { getBillingUser } from "@/lib/db/billing";

export default async function UpgradePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in?callbackUrl=/upgrade");

  const billing = await getBillingUser(userId);
  // The session can outlive a deleted account
  if (!billing) redirect("/sign-in");
  // Subscribers change plans through the billing portal on Settings
  if (billing.isPro || billing.stripeSubscriptionId) redirect("/settings");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 py-4">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Upgrade to Pro</h1>
        <p className="mt-2 text-muted-foreground">
          Unlimited items and collections, file and image uploads, and AI features.
        </p>
      </header>
      <UpgradePlans />
    </div>
  );
}
