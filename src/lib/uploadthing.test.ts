import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { verifyUploadToken } from "@/lib/upload-token";
import {
  deleteUploadedFile,
  getSignedFileUrl,
  uploadComplete,
  uploadMiddleware,
} from "@/lib/uploadthing";

const { deleteFiles, generateSignedURL } = vi.hoisted(() => ({
  deleteFiles: vi.fn(),
  generateSignedURL: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("uploadthing/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("uploadthing/server")>()),
  UTApi: class {
    deleteFiles = deleteFiles;
    generateSignedURL = generateSignedURL;
  },
}));

// auth() is overloaded (it also wraps middleware), so narrow it to the session getter
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

const MB = 1024 * 1024;
const IMAGE = { name: "photo.png", size: MB, type: "image/png" };

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("uploadMiddleware", () => {
  it("rejects uploads without a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(uploadMiddleware("images")({ files: [IMAGE] })).rejects.toThrow(
      "You must be signed in to upload files."
    );
  });

  it("rejects files that break the type's limits", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" }, expires: "" } as Session);
    await expect(
      uploadMiddleware("images")({ files: [{ ...IMAGE, size: 6 * MB }] })
    ).rejects.toThrow("Files can be up to 5 MB");
    await expect(
      uploadMiddleware("files")({ files: [{ name: "run.exe", size: 100, type: "" }] })
    ).rejects.toThrow(/^Allowed file types/);
  });

  it("passes the session user to the upload callback", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" }, expires: "" } as Session);
    await expect(uploadMiddleware("images")({ files: [IMAGE] })).resolves.toEqual({
      userId: "user-1",
    });
  });
});

describe("uploadComplete", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
  });

  it("returns a signed token for the uploaded file", async () => {
    const result = await uploadComplete("images")({
      metadata: { userId: "user-1" },
      file: { ...IMAGE, key: "abc_photo.png" },
    });
    expect(result.error).toBeNull();
    expect(verifyUploadToken("user-1", result.uploadToken ?? "")).toEqual({
      typeSlug: "images",
      key: "abc_photo.png",
      name: "photo.png",
      size: MB,
      mimeType: "image/png",
    });
    expect(deleteFiles).not.toHaveBeenCalled();
  });

  it("falls back to a generic MIME type when none was reported", async () => {
    const result = await uploadComplete("files")({
      metadata: { userId: "user-1" },
      file: { key: "abc_app.ini", name: "app.ini", size: 100, type: "" },
    });
    expect(verifyUploadToken("user-1", result.uploadToken ?? "")?.mimeType).toBe(
      "application/octet-stream"
    );
  });

  it("deletes a stored file that breaks the limits and returns an error", async () => {
    deleteFiles.mockResolvedValue({ success: true, deletedCount: 1 });
    const result = await uploadComplete("images")({
      metadata: { userId: "user-1" },
      file: { ...IMAGE, key: "abc_photo.png", size: 6 * MB },
    });
    expect(result).toEqual({ uploadToken: null, error: "Files can be up to 5 MB" });
    expect(deleteFiles).toHaveBeenCalledWith("abc_photo.png");
  });
});

describe("deleteUploadedFile", () => {
  it("deletes the file by key", async () => {
    deleteFiles.mockResolvedValue({ success: true, deletedCount: 1 });
    await deleteUploadedFile("abc_photo.png");
    expect(deleteFiles).toHaveBeenCalledWith("abc_photo.png");
    expect(console.error).not.toHaveBeenCalled();
  });

  it("logs instead of throwing when UploadThing fails or reports no success", async () => {
    deleteFiles.mockRejectedValue(new Error("network down"));
    await expect(deleteUploadedFile("abc_photo.png")).resolves.toBeUndefined();
    deleteFiles.mockResolvedValue({ success: false, deletedCount: 0 });
    await expect(deleteUploadedFile("abc_photo.png")).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledTimes(2);
  });
});

describe("getSignedFileUrl", () => {
  it("returns a short-lived signed URL for the key", async () => {
    generateSignedURL.mockResolvedValue({ ufsUrl: "https://app.ufs.sh/f/abc?sig=1" });
    await expect(getSignedFileUrl("abc")).resolves.toBe("https://app.ufs.sh/f/abc?sig=1");
    expect(generateSignedURL).toHaveBeenCalledWith("abc", { expiresIn: 60 });
  });
});
