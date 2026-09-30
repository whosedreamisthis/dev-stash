import { Upload } from "lucide-react";
import { formatFileSize } from "@/lib/upload-constraints";

interface UploadDropzoneProps {
  id?: string;
  extensions: readonly string[];
  maxSize: number;
  onClick: () => void;
  disabled?: boolean;
  "aria-describedby"?: string;
}

// The empty upload field: opens the file picker and lists what's allowed
export function UploadDropzone({
  id,
  extensions,
  maxSize,
  onClick,
  disabled,
  "aria-describedby": ariaDescribedBy,
}: UploadDropzoneProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
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
  );
}
