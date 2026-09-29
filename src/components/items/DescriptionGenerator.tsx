"use client";

import { useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateDescription } from "@/actions/ai";
import { useHasProAccess } from "@/components/billing/PlanContext";
import { Button } from "@/components/ui/button";
import { parseTagInput } from "@/lib/validations/items";

export interface DescriptionSource {
  title: string;
  typeSlug: string;
  content?: string;
  language?: string;
  url?: string;
  fileName?: string | null;
  fileMimeType?: string | null;
  // The form's comma-separated tags input
  tags: string;
}

interface DescriptionGeneratorProps {
  source: DescriptionSource;
  onGenerate: (description: string) => void;
  // The description input, shown with the generate button to its right
  children: React.ReactNode;
}

// AI description for the item as typed; it goes into the form, not the database
export function DescriptionGenerator({ source, onGenerate, children }: DescriptionGeneratorProps) {
  const hasProAccess = useHasProAccess();
  const [isPending, startTransition] = useTransition();

  if (!hasProAccess) return children;

  const hasSomething = Boolean(
    source.title.trim() || source.content?.trim() || source.url?.trim() || source.fileName
  );

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateDescription({ ...source, tags: parseTagInput(source.tags) });
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Couldn't generate a description");
        return;
      }
      onGenerate(result.data);
    });
  }

  const label = isPending ? "Generating description…" : "Generate description";

  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleGenerate}
        disabled={isPending || !hasSomething}
        aria-label={label}
        title={label}
        className="shrink-0"
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
      </Button>
    </div>
  );
}
