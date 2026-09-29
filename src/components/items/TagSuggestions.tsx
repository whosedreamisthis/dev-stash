"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { generateAutoTags } from "@/actions/ai";
import { useHasProAccess } from "@/components/billing/PlanContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseTagInput } from "@/lib/validations/items";

interface TagSuggestionsProps {
  title: string;
  content: string;
  typeSlug: string;
  // The form's comma-separated tags input
  tags: string;
  onAccept: (tag: string) => void;
  // The tags input, shown with the Suggest Tags button to its right
  children: React.ReactNode;
}

// AI tag suggestions for the item as typed; accepted tags go into the form, not the database
export function TagSuggestions({
  title,
  content,
  typeSlug,
  tags,
  onAccept,
  children,
}: TagSuggestionsProps) {
  const hasProAccess = useHasProAccess();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  if (!hasProAccess) return children;

  function handleSuggest() {
    startTransition(async () => {
      const result = await generateAutoTags({
        title,
        content,
        typeSlug,
        tags: parseTagInput(tags),
      });
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Couldn't suggest tags");
        return;
      }
      if (result.data.length === 0) toast.info("No new tags to suggest");
      setSuggestions(result.data);
    });
  }

  function remove(tag: string) {
    setSuggestions((prev) => prev.filter((suggestion) => suggestion !== tag));
  }

  function accept(tag: string) {
    onAccept(tag);
    remove(tag);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">{children}</div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSuggest}
          disabled={isPending || !title.trim()}
          className="shrink-0"
        >
          {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {isPending ? "Suggesting…" : "Suggest Tags"}
        </Button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {suggestions.map((tag) => (
            <Badge key={tag} variant="outline" className="h-6 gap-1 border-dashed pr-0.5">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => accept(tag)}
                aria-label={`Add tag ${tag}`}
                className="size-5"
              >
                <Check />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => remove(tag)}
                aria-label={`Dismiss tag ${tag}`}
                className="size-5"
              >
                <X />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
