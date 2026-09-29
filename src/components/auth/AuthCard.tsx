import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  // Sits under the fixed homepage nav: leaves room for it and drops the logo the nav already shows
  belowNav?: boolean;
}

export function AuthCard({ title, description, children, footer, belowNav = false }: AuthCardProps) {
  return (
    <main className={cn("flex min-h-screen items-center justify-center p-4", belowNav && "pt-20")}>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {!belowNav && (
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-600 text-white">
              <Layers className="size-5" />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">{children}</div>

        <p className="text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </main>
  );
}
