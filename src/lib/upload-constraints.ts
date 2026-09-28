// Shared by the upload form (friendly errors) and the server (enforcement)

export const UPLOAD_TYPE_SLUGS = ["images", "files"] as const;

export type UploadTypeSlug = (typeof UPLOAD_TYPE_SLUGS)[number];

export interface UploadConstraint {
  maxSize: number; // bytes
  extensions: readonly string[];
  mimeTypes: readonly string[];
}

const MB = 1024 * 1024;

export const UPLOAD_CONSTRAINTS: Record<UploadTypeSlug, UploadConstraint> = {
  // No SVG: it can carry scripts, which would run if it's ever opened directly
  images: {
    maxSize: 5 * MB,
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    mimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
  },
  files: {
    maxSize: 10 * MB,
    extensions: [
      ".pdf",
      ".txt",
      ".md",
      ".json",
      ".yaml",
      ".yml",
      ".xml",
      ".csv",
      ".toml",
      ".ini",
    ],
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ],
  },
};

export function isUploadTypeSlug(slug: string): slug is UploadTypeSlug {
  return (UPLOAD_TYPE_SLUGS as readonly string[]).includes(slug);
}

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

// Browsers report inconsistent MIME types for text files (none for .md or .ini,
// application/vnd.ms-excel for .csv on Windows), so the extension decides for
// files and the MIME type is only checked for images
export function getUploadError(
  typeSlug: UploadTypeSlug,
  file: { name: string; size: number; type: string }
): string | null {
  const { maxSize, extensions, mimeTypes } = UPLOAD_CONSTRAINTS[typeSlug];
  const typeError = `Allowed file types: ${extensions.join(", ")}`;

  if (!extensions.includes(getExtension(file.name))) return typeError;
  if (typeSlug === "images" && !mimeTypes.includes(file.type)) return typeError;

  if (file.size > maxSize) {
    return `Files can be up to ${formatFileSize(maxSize)}`;
  }

  return null;
}

// Always an attachment, with an ASCII fallback name for older clients and the
// full UTF-8 name for the rest
export function getContentDisposition(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1).replace(/\.0$/, "")} KB`;
  return `${(bytes / MB).toFixed(1).replace(/\.0$/, "")} MB`;
}
