import { countCollections } from "@/lib/db/collections";
import { getItemStats } from "@/lib/db/items";

export const FREE_LIMITS = { items: 50, collections: 3 } as const;

export const PRO_REQUIRED_ERROR = "This feature requires DevStash Pro.";
export const ITEM_LIMIT_ERROR = `Free accounts can have up to ${FREE_LIMITS.items} items. Upgrade to Pro for unlimited items.`;
export const COLLECTION_LIMIT_ERROR = `Free accounts can have up to ${FREE_LIMITS.collections} collections. Upgrade to Pro for unlimited collections.`;

export interface PlanUser {
  id: string;
  isPro: boolean;
}

// Read on each call so tests can switch it with vi.stubEnv
function isPlanEnforced() {
  return process.env.ENFORCE_PLANS === "true";
}

// Everyone is Pro until ENFORCE_PLANS is "true"
export function hasProAccess(user: { isPro: boolean }): boolean {
  if (!isPlanEnforced()) return true;
  return user.isPro;
}

export function isAtLimit(user: { isPro: boolean }, count: number, limit: number): boolean {
  return !hasProAccess(user) && count >= limit;
}

// The limit error when the user can't create another item, otherwise null
export async function checkItemLimit(user: PlanUser): Promise<string | null> {
  if (hasProAccess(user)) return null;
  const { total } = await getItemStats(user.id);
  return isAtLimit(user, total, FREE_LIMITS.items) ? ITEM_LIMIT_ERROR : null;
}

// The limit error when the user can't create another collection, otherwise null
export async function checkCollectionLimit(user: PlanUser): Promise<string | null> {
  if (hasProAccess(user)) return null;
  const count = await countCollections(user.id);
  return isAtLimit(user, count, FREE_LIMITS.collections) ? COLLECTION_LIMIT_ERROR : null;
}
