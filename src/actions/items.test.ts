import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import { createItem, deleteItem, updateItem } from "@/actions/items";
import type { ItemDetail } from "@/types/items";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/items", () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

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

  it("rejects types that can't be created", async () => {
    signIn();
    const result = await createItem({ ...CREATE_INPUT, typeSlug: "files" as never });
    expect(result.fieldErrors?.typeSlug).toBe("Choose an item type");
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("creates the parsed input for the session user and returns the item", async () => {
    signIn("user-42");
    const created = { id: "item-1", title: "useAuth Hook" } as ItemDetail;
    vi.mocked(createItemQuery).mockResolvedValue(created);
    await expect(createItem(CREATE_INPUT)).resolves.toEqual({ success: true, data: created });
    expect(createItemQuery).toHaveBeenCalledWith("user-42", {
      typeSlug: "snippets",
      title: "useAuth Hook",
      description: null,
      content: "  code",
      tags: ["react"],
    });
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
    vi.mocked(deleteItemQuery).mockResolvedValue(true);
    await expect(deleteItem("item-1")).resolves.toEqual({
      success: true,
      data: { id: "item-1" },
    });
    expect(deleteItemQuery).toHaveBeenCalledWith("user-42", "item-1");
  });

  it("reports a missing or another user's item as not found", async () => {
    signIn();
    vi.mocked(deleteItemQuery).mockResolvedValue(false);
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
