import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Star } from "lucide-react";
import { auth } from "@/auth";
import { FavoritesList } from "@/components/favorites/FavoritesList";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";

export default async function FavoritesPage() {
  // Render per request so the list reflects the current database state
  await connection();

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in?callbackUrl=/favorites");

  const [items, collections] = await Promise.all([
    getFavoriteItems(userId),
    getFavoriteCollections(userId),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex min-w-0 items-center gap-3">
        <Star className="size-7 shrink-0 fill-yellow-400 text-yellow-400" />
        <h1 className="truncate text-3xl font-bold tracking-tight">Favorites</h1>
      </header>

      {items.length === 0 && collections.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No favorites yet. Star items and collections to find them here.
        </p>
      ) : (
        <FavoritesList items={items} collections={collections} />
      )}
    </div>
  );
}
