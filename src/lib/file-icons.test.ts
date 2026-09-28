import { describe, expect, it } from "vitest";
import { File, FileBraces, FileCode, FileSpreadsheet, FileText } from "lucide-react";
import { getFileIcon } from "@/lib/file-icons";

describe("getFileIcon", () => {
  it.each([
    ["report.pdf", FileText],
    ["notes.md", FileText],
    ["readme.txt", FileText],
    ["package.json", FileBraces],
    ["data.csv", FileSpreadsheet],
    ["config.yaml", FileCode],
    ["config.yml", FileCode],
    ["pyproject.toml", FileCode],
    ["settings.ini", FileCode],
    ["feed.xml", FileCode],
  ])("picks the icon for %s", (fileName, icon) => {
    expect(getFileIcon(fileName)).toBe(icon);
  });

  it("ignores the extension's case and uses the last dot", () => {
    expect(getFileIcon("REPORT.PDF")).toBe(FileText);
    expect(getFileIcon("archive.backup.json")).toBe(FileBraces);
  });

  it("falls back to a plain file icon", () => {
    expect(getFileIcon("photo.png")).toBe(File);
    expect(getFileIcon("Makefile")).toBe(File);
    expect(getFileIcon("trailing.")).toBe(File);
    expect(getFileIcon(null)).toBe(File);
  });
});
