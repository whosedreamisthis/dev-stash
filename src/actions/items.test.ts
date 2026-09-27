import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { updateItem as updateItemQuery } from "@/lib/db/items";
import { updateItem } from "@/actions/items";
import type { ItemDetail } from "@/types/items";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/items", () => ({ updateItem: vi.fn() }));

// auth() is overloaded (it also wraps middleware), so narrow it to the session getter
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

function signIn(userId = "user-1") {
  mockAuth.mockResolvedValue({ user: { id: userId }, expires: "" } as Session);
}

const INPUT = { title: " useAuth Hook ", description: "", tags: ["react", "react"] };

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
