import { Sparkles } from "lucide-react";
import { UpgradeButtons } from "@/components/billing/UpgradeButtons";

interface ProUpgradePromptProps {
  // Plural type name, e.g. "Files"
  feature: string;
}

// Shown in place of a Pro-only page for users without Pro access
export function ProUpgradePrompt({ feature }: ProUpgradePromptProps) {
  return (
    <section className="flex flex-col items-center gap-5 rounded-xl border bg-card px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-6" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-semibold">{feature} are a Pro feature</h2>
        <p className="text-muted-foreground">
          Upgrade to DevStash Pro to upload and keep files and images, with unlimited items and
          collections.
        </p>
      </div>
      <UpgradeButtons />
    </section>
  );
}
