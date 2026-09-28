import { Download } from "lucide-react";
import { FileTypeIcon } from "@/components/items/FileTypeIcon";
import { buttonVariants } from "@/components/ui/button";
import { formatFileSize } from "@/lib/upload-constraints";
import type { ItemDetail } from "@/types/items";

// Image preview for images, then the file's name, size and type with a download link
export function ItemFileContent({ item }: { item: ItemDetail }) {
  const fileUrl = `/api/items/${encodeURIComponent(item.id)}/file`;
  const isImage = item.type.slug === "images";
  const details = [
    item.fileSize != null ? formatFileSize(item.fileSize) : null,
    item.fileMimeType,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {isImage && (
        // Served by the app's download proxy, which next/image can't optimize
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fileUrl}
          alt={item.fileName ?? item.title}
          className="max-h-96 w-full rounded-lg border bg-muted/40 object-contain"
        />
      )}
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <FileTypeIcon fileName={item.fileName} typeSlug={item.type.slug} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.fileName ?? "Untitled file"}</p>
          {details.length > 0 && (
            <p className="truncate text-xs text-muted-foreground">{details.join(" · ")}</p>
          )}
        </div>
        <a
          href={fileUrl}
          download={item.fileName ?? true}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Download />
          Download
        </a>
      </div>
    </div>
  );
}
