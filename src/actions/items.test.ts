import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  getItemDetail,
  setItemFavorite as setItemFavoriteQuery,
  setItemPinned as setItemPinnedQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import { createUploadToken } from "@/lib/upload-token";
import { deleteUploadedFile } from "@/lib/uploadthing";
import {
  createItem,
  deleteItem,
  getItem,
  setItemFavorite,
  toggleItemPin,
  updateItem,
} from "@/actions/items";
import type { ItemDetail } from "@/types/items";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/items", () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  getItemDetail: vi.fn(),
  setItemFavorite: vi.fn(),
  setItemPinned: vi.fn(),
}));
vi.mock("@/lib/uploadthing", () => ({ deleteUploadedFile: vi.fn() }));

const UPLOADED_FILE = {
  typeSlug: "images" as const,
  key: "abc_photo.png",
  name: "photo.png",
  size: 2048,
  mimeType: "image/png",
};

// auth() is overloaded (it also wraps middleware), so narrow it to the session getter
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

function signIn(userId = "user-1") {
  mockAuth.mockResolvedValue({ user: { id: userId }, expires: "" } as Session);
}

const INPUT = { title: " useAuth Hook ", description: "", tags: ["react", "react"] };

describe("createItem", () => {
  const CREATE_INPUT = { ...INPUT, typeSlug: "snippets" as const, content: "  code" };

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(createItem(CREATE_INPUT)).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    signIn();
    const result = await createItem({ ...CREATE_INPUT, typeSlug: "links", title: "" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Please fix the highlighted fields.");
    expect(result.fieldErrors?.title).toBe("Title is required");
    expect(result.fieldErrors?.url).toBe("URL is required");
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("passes the chosen collection IDs to the query, without duplicates", async () => {
    signIn("user-42");
    vi.mocked(createItemQuery).mockResolvedValue({ id: "item-1" } as ItemDetail);
    await createItem({ ...CREATE_INPUT, collectionIds: ["c1", "c2", "c1"] });
    expect(createItemQuery).toHaveBeenCalledWith(
      "user-42",
      expect.objectContaining({ collectionIds: ["c1", "c2"] }),
      undefined
    );
  });

  it("returns a field error for too many collections", async () => {
    signIn();
    const collectionIds = Array.from({ length: 51 }, (_, i) => `c${i}`);
    const result = await createItem({ ...CREATE_INPUT, collectionIds });
    expect(result.fieldErrors?.collectionIds).toBe("An item can be in up to 50 collections");
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("rejects types that can't be created", async () => {
    signIn();
    const result = await createItem({ ...CREATE_INPUT, typeSlug: "videos" as never });
    expect(result.fieldErrors?.typeSlug).toBe("Choose an item type");
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  describe("with an upload", () => {
    const IMAGE_INPUT = { ...INPUT, typeSlug: "images" as const };

    beforeEach(() => {
      vi.stubEnv("AUTH_SECRET", "test-secret");
    });

    it("requires an upload for file types", async () => {
      signIn();
      const result = await createItem(IMAGE_INPUT);
      expect(result.fieldErrors?.uploadToken).toBe("Upload a file");
      expect(createItemQuery).not.toHaveBeenCalled();
    });

    it("creates the item with the file from the signed upload token", async () => {
      signIn("user-42");
      const created = { id: "item-1", title: "useAuth Hook" } as ItemDetail;
      vi.mocked(createItemQuery).mockResolvedValue(created);
      const uploadToken = createUploadToken("user-42", UPLOADED_FILE);
      await expect(createItem({ ...IMAGE_INPUT, uploadToken })).resolves.toEqual({
        success: true,
        data: created,
      });
      expect(createItemQuery).toHaveBeenCalledWith(
        "user-42",
        expect.objectContaining({ typeSlug: "images" }),
        UPLOADED_FILE
      );
    });

    it("rejects another user's, tampered or mismatched upload tokens", async () => {
      signIn("user-42");
      const tokens = [
        createUploadToken("user-1", UPLOADED_FILE),
        `${createUploadToken("user-42", UPLOADED_FILE)}x`,
        createUploadToken("user-42", { ...UPLOADED_FILE, typeSlug: "files" }),
      ];
      for (const uploadToken of tokens) {
        const result = await createItem({ ...IMAGE_INPUT, uploadToken });
        expect(result.success).toBe(false);
        expect(result.fieldErrors?.uploadToken).toBe(
          "The upload has expired. Please upload the file again."
        );
      }
      expect(createItemQuery).not.toHaveBeenCalled();
    });

    it("ignores upload tokens for types without files", async () => {
      signIn("user-42");
      vi.mocked(createItemQuery).mockResolvedValue({ id: "item-1" } as ItemDetail);
      const uploadToken = createUploadToken("user-42", UPLOADED_FILE);
      await createItem({ ...CREATE_INPUT, uploadToken });
      expect(createItemQuery).toHaveBeenCalledWith(
        "user-42",
        expect.objectContaining({ typeSlug: "snippets" }),
        undefined
      );
    });
  });

  it("creates the parsed input for the session user and returns the item", async () => {
    signIn("user-42");
    const created = { id: "item-1", title: "useAuth Hook" } as ItemDetail;
    vi.mocked(createItemQuery).mockResolvedValue(created);
    await expect(createItem(CREATE_INPUT)).resolves.toEqual({ success: true, data: created });
    expect(createItemQuery).toHaveBeenCalledWith(
      "user-42",
      {
        typeSlug: "snippets",
        title: "useAuth Hook",
        description: null,
        content: "  code",
        tags: ["react"],
      },
      undefined
    );
  });

  it("reports a missing item type", async () => {
    signIn();
    vi.mocked(createItemQuery).mockResolvedValue(null);
    await expect(createItem(CREATE_INPUT)).resolves.toEqual({
      success: false,
      error: "That item type isn't available.",
    });
  });

  it("returns a generic error when creating fails", async () => {
    signIn();
    vi.mocked(createItemQuery).mockRejectedValue(new Error("db down"));
    await expect(createItem(CREATE_INPUT)).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("updateItem", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(updateItem("item-1", INPUT)).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(updateItemQuery).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    signIn();
    const result = await updateItem("item-1", { ...INPUT, title: " ", url: "nope" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Please fix the highlighted fields.");
    expect(result.fieldErrors?.title).toBe("Title is required");
    expect(result.fieldErrors?.url).toBe("Enter a valid http(s) URL");
    expect(updateItemQuery).not.toHaveBeenCalled();
  });

  it("saves the parsed input for the session user and returns the item", async () => {
    signIn("user-42");
    const saved = { id: "item-1", title: "useAuth Hook" } as ItemDetail;
    vi.mocked(updateItemQuery).mockResolvedValue(saved);
    await expect(updateItem("item-1", INPUT)).resolves.toEqual({ success: true, data: saved });
    expect(updateItemQuery).toHaveBeenCalledWith("user-42", "item-1", {
      title: "useAuth Hook",
      description: null,
      tags: ["react"],
    });
  });

  it("reports a missing or another user's item as not found", async () => {
    signIn();
    vi.mocked(updateItemQuery).mockResolvedValue(null);
    await expect(updateItem("item-1", INPUT)).resolves.toEqual({
      success: false,
      error: "Item not found.",
    });
  });

  it("returns a generic error when saving fails", async () => {
    signIn();
    vi.mocked(updateItemQuery).mockRejectedValue(new Error("db down"));
    await expect(updateItem("item-1", INPUT)).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("setItemFavorite", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(setItemFavorite("item-1", true)).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(setItemFavoriteQuery).not.toHaveBeenCalled();
  });

  it("rejects invalid input without querying", async () => {
    signIn();
    await expect(setItemFavorite("  ", true)).resolves.toEqual({
      success: false,
      error: "Item not found.",
    });
    await expect(setItemFavorite("item-1", "yes" as unknown as boolean)).resolves.toEqual({
      success: false,
      error: "Item not found.",
    });
    expect(setItemFavoriteQuery).not.toHaveBeenCalled();
  });

  it("sets the favorite state on the session user's item", async () => {
    signIn("user-42");
    vi.mocked(setItemFavoriteQuery).mockResolvedValue(true);
    await expect(setItemFavorite(" item-1 ", true)).resolves.toEqual({
      success: true,
      data: { id: "item-1", isFavorite: true },
    });
    expect(setItemFavoriteQuery).toHaveBeenCalledWith("user-42", "item-1", true);
  });

  it("returns not found when nothing was updated", async () => {
    signIn();
    vi.mocked(setItemFavoriteQuery).mockResolvedValue(false);
    await expect(setItemFavorite("item-1", false)).resolves.toEqual({
      success: false,
      error: "Item not found.",
    });
  });

  it("returns a generic error when the update fails", async () => {
    signIn();
    vi.mocked(setItemFavoriteQuery).mockRejectedValue(new Error("db down"));
    await expect(setItemFavorite("item-1", true)).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("toggleItemPin", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(toggleItemPin("item-1", true)).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(setItemPinnedQuery).not.toHaveBeenCalled();
  });

  it("rejects invalid input without querying", async () => {
    signIn();
    await expect(toggleItemPin("  ", true)).resolves.toEqual({
      success: false,
      error: "Item not found.",
    });
    await expect(toggleItemPin("item-1", "yes" as unknown as boolean)).resolves.toEqual({
      success: false,
      error: "Item not found.",
    });
    expect(setItemPinnedQuery).not.toHaveBeenCalled();
  });

  it("sets the pinned state on the session user's item", async () => {
    signIn("user-42");
    vi.mocked(setItemPinnedQuery).mockResolvedValue(true);
    await expect(toggleItemPin(" item-1 ", true)).resolves.toEqual({
      success: true,
      data: { id: "item-1", isPinned: true },
    });
    expect(setItemPinnedQuery).toHaveBeenCalledWith("user-42", "item-1", true);
  });

  it("returns not found when nothing was updated", async () => {
    signIn();
    vi.mocked(setItemPinnedQuery).mockResolvedValue(false);
    await expect(toggleItemPin("item-1", false)).resolves.toEqual({
      success: false,
      error: "Item not found.",
    });
  });

  it("returns a generic error when the update fails", async () => {
    signIn();
    vi.mocked(setItemPinnedQuery).mockRejectedValue(new Error("db down"));
    await expect(toggleItemPin("item-1", true)).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("deleteItem", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(deleteItem("item-1")).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(deleteItemQuery).not.toHaveBeenCalled();
  });

  it("rejects an empty item ID without querying", async () => {
    signIn();
    await expect(deleteItem("  ")).resolves.toEqual({
      success: false,
      error: "Item not found.",
    });
    expect(deleteItemQuery).not.toHaveBeenCalled();
  });

  it("deletes the item for the session user and returns its ID", async () => {
    signIn("user-42");
    vi.mocked(deleteItemQuery).mockResolvedValue({ fileKey: null });
    await expect(deleteItem("item-1")).resolves.toEqual({
      success: true,
      data: { id: "item-1" },
    });
    expect(deleteItemQuery).toHaveBeenCalledWith("user-42", "item-1");
    expect(deleteUploadedFile).not.toHaveBeenCalled();
  });

  it("deletes the item's file from UploadThing", async () => {
    signIn();
    vi.mocked(deleteItemQuery).mockResolvedValue({ fileKey: "abc_photo.png" });
    await expect(deleteItem("item-1")).resolves.toMatchObject({ success: true });
    expect(deleteUploadedFile).toHaveBeenCalledWith("abc_photo.png");
  });

  it("reports a missing or another user's item as not found", async () => {
    signIn();
    vi.mocked(deleteItemQuery).mockResolvedValue(null);
    await expect(deleteItem("item-1")).resolves.toEqual({
      success: false,
      error: "Item not found.",
    });
  });

  it("returns a generic error when deleting fails", async () => {
    signIn();
    vi.mocked(deleteItemQuery).mockRejectedValue(new Error("db down"));
    await expect(deleteItem("item-1")).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("getItem", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getItem("item-1")).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(getItemDetail).not.toHaveBeenCalled();
  });

  it("returns the session user's item detail", async () => {
    signIn("user-42");
    const detail = { id: "item-1", title: "useAuth Hook" } as ItemDetail;
    vi.mocked(getItemDetail).mockResolvedValue(detail);
    await expect(getItem("item-1")).resolves.toEqual({ success: true, data: detail });
    expect(getItemDetail).toHaveBeenCalledWith("user-42", "item-1");
  });

  it("reports a missing or another user's item as not found", async () => {
    signIn();
    vi.mocked(getItemDetail).mockResolvedValue(null);
    await expect(getItem("item-1")).resolves.toEqual({
      success: false,
      error: "Item not found.",
    });

    await expect(getItem("  ")).resolves.toEqual({ success: false, error: "Item not found." });
    expect(getItemDetail).toHaveBeenCalledOnce();
  });

  it("returns an error when the lookup fails", async () => {
    signIn();
    vi.mocked(getItemDetail).mockRejectedValue(new Error("db down"));
    await expect(getItem("item-1")).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
