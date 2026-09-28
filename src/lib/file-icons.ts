import {
  File,
  FileBraces,
  FileCode,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from "lucide-react";

const ICONS_BY_EXTENSION: Record<string, LucideIcon> = {
  pdf: FileText,
  txt: FileText,
  md: FileText,
  json: FileBraces,
  csv: FileSpreadsheet,
  xml: FileCode,
  yaml: FileCode,
  yml: FileCode,
  toml: FileCode,
  ini: FileCode,
};

// Picks an icon from the file name's extension, falling back to a plain file
export function getFileIcon(fileName: string | null): LucideIcon {
  const dot = fileName?.lastIndexOf(".") ?? -1;
  if (!fileName || dot === -1) return File;
  return ICONS_BY_EXTENSION[fileName.slice(dot + 1).toLowerCase()] ?? File;
}
