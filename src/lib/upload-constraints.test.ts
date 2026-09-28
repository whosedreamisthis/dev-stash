import { describe, expect, it } from "vitest";
import {
  formatFileSize,
  getContentDisposition,
  getUploadError,
} from "@/lib/upload-constraints";

const MB = 1024 * 1024;

describe("getUploadError", () => {
  it("accepts allowed images up to 5 MB", () => {
    expect(getUploadError("images", { name: "a.PNG", size: 5 * MB, type: "image/png" })).toBeNull();
    expect(
      getUploadError("images", { name: "logo.svg", size: 100, type: "image/svg+xml" })
    ).toBeNull();
  });

  it("rejects images that are too large, the wrong extension or the wrong type", () => {
    expect(
      getUploadError("images", { name: "a.png", size: 5 * MB + 1, type: "image/png" })
    ).toBe("Files can be up to 5 MB");
    expect(getUploadError("images", { name: "a.bmp", size: 100, type: "image/bmp" })).toMatch(
      /^Allowed file types/
    );
    expect(getUploadError("images", { name: "a.png", size: 100, type: "text/html" })).toMatch(
      /^Allowed file types/
    );
  });

  it("accepts files by extension up to 10 MB, whatever MIME type the browser reports", () => {
    expect(getUploadError("files", { name: "notes.md", size: 10 * MB, type: "" })).toBeNull();
    expect(
      getUploadError("files", { name: "data.csv", size: 100, type: "application/vnd.ms-excel" })
    ).toBeNull();
    expect(getUploadError("files", { name: "app.ini", size: 100, type: "" })).toBeNull();
  });

  it("rejects files that are too large or have other extensions", () => {
    expect(getUploadError("files", { name: "a.pdf", size: 10 * MB + 1, type: "" })).toBe(
      "Files can be up to 10 MB"
    );
    expect(getUploadError("files", { name: "run.exe", size: 100, type: "" })).toMatch(
      /^Allowed file types/
    );
    expect(getUploadError("files", { name: "README", size: 100, type: "" })).toMatch(
      /^Allowed file types/
    );
  });
});

describe("formatFileSize", () => {
  it("formats bytes, kilobytes and megabytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(5 * MB)).toBe("5 MB");
  });
});

describe("getContentDisposition", () => {
  it("always downloads, with an ASCII fallback and the full UTF-8 name", () => {
    expect(getContentDisposition('ré"sumé.pdf')).toBe(
      `attachment; filename="r__sum_.pdf"; filename*=UTF-8''r%C3%A9%22sum%C3%A9.pdf`
    );
  });
});
