interface FavoritesSectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

// A titled list with a count; hidden when there's nothing in it
export function FavoritesSection({ title, count, children }: FavoritesSectionProps) {
  if (count === 0) return null;

  return (
    <section>
      <h2 className="flex items-center gap-2 border-b px-3 pb-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
        {title}
        <span className="text-foreground">{count}</span>
      </h2>
      <ul className="divide-y divide-border/50">{children}</ul>
    </section>
  );
}
