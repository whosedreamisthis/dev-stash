import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BillingPlanCard } from "@/components/billing/BillingPlanCard";
import { CheckoutToast, type CheckoutStatus } from "@/components/billing/CheckoutToast";
import { AccountActions } from "@/components/settings/AccountActions";
import { EditorPreferencesSection } from "@/components/settings/EditorPreferencesSection";
import { syncCheckoutSession } from "@/lib/billing";
import { getBillingUser } from "@/lib/db/billing";
import { countCollections } from "@/lib/db/collections";
import { getItemStats } from "@/lib/db/items";
import { getProfileUser } from "@/lib/db/users";
import { FREE_LIMITS } from "@/lib/usage-limits";

const CHECKOUT_STATUSES: readonly CheckoutStatus[] = ["success", "canceled"];

function parseCheckoutStatus(value: unknown): CheckoutStatus | null {
  return CHECKOUT_STATUSES.find((status) => status === value) ?? null;
}

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in?callbackUrl=/settings");

  const { session_id: sessionId, checkout } = await searchParams;
  if (typeof sessionId === "string") {
    // Best effort: the webhook applies the same change if this fails
    await syncCheckoutSession(userId, sessionId).catch((error) =>
      console.error("Syncing checkout session failed:", error),
    );
    // Redirected so a refresh doesn't sync again
    redirect("/settings?checkout=success");
  }

  const [user, billing, itemStats, collectionCount] = await Promise.all([
    getProfileUser(userId),
    getBillingUser(userId),
    getItemStats(userId),
    countCollections(userId),
  ]);
  // The session can outlive a deleted account
  if (!user || !billing) redirect("/sign-in");

  const checkoutStatus = parseCheckoutStatus(checkout);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your editor, plan and account</p>
      </header>
      <EditorPreferencesSection />
      <BillingPlanCard
        isPro={billing.isPro}
        periodEnd={billing.stripeCurrentPeriodEnd}
        hasCustomer={billing.stripeCustomerId !== null}
        usage={{ items: itemStats.total, collections: collectionCount }}
        limits={FREE_LIMITS}
      />
      <AccountActions hasPassword={user.hasPassword} />
      {checkoutStatus && <CheckoutToast status={checkoutStatus} />}
    </div>
  );
}
