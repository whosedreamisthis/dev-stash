"use client";

import { useRef, useState } from "react";
import { File as FileIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMountedRef } from "@/hooks/useIsMountedRef";
import { usePreviewUrl } from "@/hooks/usePreviewUrl";
import { cn } from "@/lib/utils";
import {
  UPLOAD_CONSTRAINTS,
  formatFileSize,
  getUploadError,
  type UploadTypeSlug,
} from "@/lib/upload-constraints";
import { useUploadThing } from "@/lib/uploadthing-client";

type UploadStatus = "idle" | "uploading" | "done";

const UPLOAD_FAILED_ERROR = "Upload failed. Please try again.";

export interface UploadedFileInfo {
  name: string;
  mimeType: string;
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { extensions, maxSize } = UPLOAD_CONSTRAINTS[typeSlug];

  const [previewUrl, setPreviewFile] = usePreviewUrl();
  const isMountedRef = useIsMountedRef();

  // Clears the file so a failed upload doesn't look selected
  function failUpload(message: string) {
    setFile(null);
    setPreviewFile(null);
    setStatus("idle");
    setError(message);
    if (inputRef.current) inputRef.current.value = "";
    onUploadingChange?.(false);
  }

  // Results that arrive after unmounting (e.g. the type was switched mid-upload)
  // belong to a field that's gone, so they're ignored
  const { startUpload } = useUploadThing(
    typeSlug === "images" ? "imageUploader" : "fileUploader",
    {
      uploadProgressGranularity: "fine",
      onUploadProgress: setProgress,
      onClientUploadComplete: (results) => {
        if (!isMountedRef.current) return;
        const uploaded = results[0];
        const serverData = uploaded?.serverData;
        if (!serverData?.uploadToken) {
          failUpload(serverData?.error ?? UPLOAD_FAILED_ERROR);
          return;
        }
        setStatus("done");
        onUploadingChange?.(false);
        onUploaded(serverData.uploadToken, { name: uploaded.name, mimeType: uploaded.type });
      },
      onUploadError: (uploadError) => {
        if (!isMountedRef.current) return;
        failUpload(uploadError.message || UPLOAD_FAILED_ERROR);
      },
    }
  );

  function handleFile(next: File | undefined) {
    if (!next || status === "uploading") return;
    const validationError = getUploadError(typeSlug, next);
    setError(validationError);
    if (validationError) return;

    setFile(next);
    setPreviewFile(typeSlug === "images" ? next : null);
    setProgress(0);
    setStatus("uploading");
    onUploaded(null);
    onUploadingChange?.(true);
    void startUpload([next]);
  }

  function handleRemove() {
    setFile(null);
    setPreviewFile(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
    onUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) handleFile(event.dataTransfer.files[0]);
  }

  const isBusy = disabled || status === "uploading";

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
          <button
            id={id}
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
            aria-describedby={ariaDescribedBy}
            className="flex flex-col items-center gap-2 rounded-md py-4 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <Upload className="size-6 text-muted-foreground" />
            <span>
              <span className="font-medium">Click to upload</span> or drag and drop
            </span>
            <span className="text-xs text-muted-foreground">
              {extensions.join(", ")} · up to {formatFileSize(maxSize)}
            </span>
          </button>
        )}

        {status === "uploading" && (
          <progress
            value={progress}
            max={100}
            aria-label="Upload progress"
            className="h-1.5 w-full appearance-none overflow-hidden rounded-full bg-muted [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-[width]"
          />
        )}
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
