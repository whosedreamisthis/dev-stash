"use client";

import { useRef, useState } from "react";
import { useIsMountedRef } from "@/hooks/useIsMountedRef";
import { usePreviewUrl } from "@/hooks/usePreviewUrl";
import { getUploadError, type UploadTypeSlug } from "@/lib/upload-constraints";
import { useUploadThing } from "@/lib/uploadthing-client";

type UploadStatus = "idle" | "uploading" | "done";

const UPLOAD_FAILED_ERROR = "Upload failed. Please try again.";

export interface UploadedFileInfo {
  name: string;
  mimeType: string;
}

interface UseFileUploadOptions {
  typeSlug: UploadTypeSlug;
  // Receives the server-signed upload token and the file's name and type, or null when the file is removed
  onUploaded: (uploadToken: string | null, file?: UploadedFileInfo) => void;
  onUploadingChange?: (isUploading: boolean) => void;
}

// Validates a chosen file, uploads it to UploadThing and tracks its progress
export function useFileUpload({ typeSlug, onUploaded, onUploadingChange }: UseFileUploadOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
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

  return {
    inputRef,
    file,
    previewUrl,
    progress,
    error,
    isUploading: status === "uploading",
    handleFile,
    handleRemove,
  };
}
