interface FavoritesSectionProps {
  title: string;
  count: number;
  // Shown at the right of the heading, e.g. a sort control
  action?: React.ReactNode;
  children: React.ReactNode;
}

// A titled list with a count; hidden when there's nothing in it
export function FavoritesSection({ title, count, action, children }: FavoritesSectionProps) {
  if (count === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between gap-2 border-b px-3 pb-2">
        <h2 className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          {title}
          <span className="text-foreground">{count}</span>
        </h2>
        {action}
      </div>
      <ul className="divide-y divide-border/50">{children}</ul>
    </section>
  );
}
