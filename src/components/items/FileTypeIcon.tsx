import { createElement } from "react";
import { getFileIcon } from "@/lib/file-icons";
import { ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";

interface FileTypeIconProps {
  fileName: string | null;
  typeSlug: string;
}

// The extension's icon in the item type's color, shared by the file list and the drawer
export function FileTypeIcon({ fileName, typeSlug }: FileTypeIconProps) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
      {/* createElement because the icon is looked up per file, which JSX
          would flag as a component created during render */}
      {createElement(getFileIcon(fileName), {
        "aria-hidden": true,
        className: cn("size-5", ITEM_TYPE_TEXT_COLORS[typeSlug]),
      })}
    </div>
  );
}
