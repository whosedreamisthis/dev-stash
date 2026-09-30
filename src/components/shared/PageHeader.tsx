interface PageHeaderProps {
  title: string;
  // Shown left of the title, sized by the caller (usually size-7)
  icon?: React.ReactNode;
  description?: string;
  // Shown on the right, e.g. a create button
  action?: React.ReactNode;
}

// The title row every app page starts with
export function PageHeader({ title, icon, description, action }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          {icon}
          <h1 className="truncate text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}
