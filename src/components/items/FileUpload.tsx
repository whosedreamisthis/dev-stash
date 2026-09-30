"use client";

import { useState } from "react";
import { File as FileIcon, X } from "lucide-react";
import { UploadDropzone } from "@/components/items/UploadDropzone";
import { UploadProgressBar } from "@/components/items/UploadProgressBar";
import { Button } from "@/components/ui/button";
import { useFileUpload, type UploadedFileInfo } from "@/hooks/useFileUpload";
import { cn } from "@/lib/utils";
import { UPLOAD_CONSTRAINTS, formatFileSize, type UploadTypeSlug } from "@/lib/upload-constraints";

interface FileUploadProps {
  id?: string;
  typeSlug: UploadTypeSlug;
  // Receives the server-signed upload token and the file's name and type, or null when the file is removed
  onUploaded: (uploadToken: string | null, file?: UploadedFileInfo) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
  "aria-describedby"?: string;
}

// Shows the chosen file: an image preview for images, name and size for files
function SelectedFile({ file, previewUrl }: { file: File; previewUrl: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {previewUrl ? (
        // A local blob preview, so next/image can't optimize it
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={file.name}
          className="size-14 shrink-0 rounded-md border object-cover"
        />
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-md border bg-muted">
          <FileIcon className="size-6 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
    </div>
  );
}

export function FileUpload({
  id,
  typeSlug,
  onUploaded,
  onUploadingChange,
  disabled,
  invalid,
  "aria-describedby": ariaDescribedBy,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { extensions, maxSize } = UPLOAD_CONSTRAINTS[typeSlug];
  const { inputRef, file, previewUrl, progress, error, isUploading, handleFile, handleRemove } =
    useFileUpload({ typeSlug, onUploaded, onUploadingChange });

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) handleFile(event.dataTransfer.files[0]);
  }

  const isBusy = disabled || isUploading;

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!isBusy) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col gap-3 rounded-lg border border-dashed p-4 transition-colors",
          isDragging && "border-primary bg-primary/5",
          (invalid || error) && "border-destructive"
        )}
      >
        {file ? (
          <div className="flex items-center justify-between gap-3">
            <SelectedFile file={file} previewUrl={previewUrl} />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleRemove}
              disabled={isBusy}
              aria-label="Remove file"
            >
              <X />
            </Button>
          </div>
        ) : (
          <UploadDropzone
            id={id}
            extensions={extensions}
            maxSize={maxSize}
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
            aria-describedby={ariaDescribedBy}
          />
        )}

        {isUploading && <UploadProgressBar value={progress} />}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={extensions.join(",")}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
        tabIndex={-1}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
