"use client";

import { Download, Pin } from "lucide-react";
import { FileTypeIcon } from "@/components/items/FileTypeIcon";
import { ItemOpenOverlay } from "@/components/items/ItemOpenOverlay";
import { FavoriteStar } from "@/components/shared/FavoriteStar";
import { buttonVariants } from "@/components/ui/button";
import { DATE_WITH_YEAR_FORMATTER } from "@/lib/format";
import { formatFileSize } from "@/lib/upload-constraints";
import { cn } from "@/lib/utils";
import type { ItemSummary } from "@/types/items";

interface FileListRowProps {
  item: ItemSummary;
}

export function FileListRow({ item }: FileListRowProps) {
  const fileName = item.fileName ?? "Untitled file";

  return (
    <li className="relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/40">
      <ItemOpenOverlay item={item} className="focus-visible:ring-inset" />
      <FileTypeIcon fileName={item.fileName} typeSlug={item.type.slug} />

      {/* Stacked on mobile; name, size and date become columns from sm up */}
      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-6">
        <div className="min-w-0 sm:flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{item.title}</h3>
            {item.isPinned && <Pin className="size-4 shrink-0 text-muted-foreground" />}
            {item.isFavorite && (
              <FavoriteStar className="size-4 shrink-0" />
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">{fileName}</p>
        </div>
        <div className="mt-1 flex gap-3 text-xs text-muted-foreground sm:contents sm:text-sm">
          <span className="sm:w-20 sm:text-right">
            {item.fileSize != null ? formatFileSize(item.fileSize) : "—"}
          </span>
          <time dateTime={item.createdAt.toISOString()} className="sm:w-28 sm:text-right">
            {DATE_WITH_YEAR_FORMATTER.format(item.createdAt)}
          </time>
        </div>
      </div>

      {/* Above the row's button, and stops the click so the drawer doesn't open */}
      <a
        href={`/api/items/${encodeURIComponent(item.id)}/file`}
        download={item.fileName ?? true}
        onClick={(event) => event.stopPropagation()}
        aria-label={`Download ${fileName}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "relative z-10 shrink-0")}
      >
        <Download />
        <span className="hidden sm:inline">Download</span>
      </a>
    </li>
  );
}
