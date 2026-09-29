import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistProps {
  items: string[];
  className?: string;
}

export function Checklist({ items, className }: ChecklistProps) {
  return (
    <ul className={cn("grid content-start gap-3", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-left text-[15px]">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Check className="size-3" strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
