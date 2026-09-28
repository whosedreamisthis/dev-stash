import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { createCollection as createCollectionQuery } from "@/lib/db/collections";
import { createCollection } from "@/actions/collections";
import type { CollectionSummary } from "@/types/collections";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/collections", () => ({ createCollection: vi.fn() }));

// auth() is overloaded (it also wraps middleware), so narrow it to the session getter
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

function signIn(userId = "user-1") {
  mockAuth.mockResolvedValue({ user: { id: userId }, expires: "" } as Session);
}

const INPUT = { name: " React Patterns ", description: "" };

describe("createCollection", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(createCollection(INPUT)).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(createCollectionQuery).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    signIn();
    const result = await createCollection({ name: "  ", description: "x".repeat(1_001) });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Please fix the highlighted fields.");
    expect(result.fieldErrors?.name).toBe("Name is required");
    expect(result.fieldErrors?.description).toBe("Description can be up to 1,000 characters");
    expect(createCollectionQuery).not.toHaveBeenCalled();
  });

  it("creates the parsed input for the session user and returns the collection", async () => {
    signIn("user-42");
    const created = { id: "col-1", name: "React Patterns" } as CollectionSummary;
    vi.mocked(createCollectionQuery).mockResolvedValue(created);
    await expect(createCollection(INPUT)).resolves.toEqual({ success: true, data: created });
    expect(createCollectionQuery).toHaveBeenCalledWith("user-42", {
      name: "React Patterns",
      description: null,
    });
  });

  it("returns a generic error when creating fails", async () => {
    signIn();
    vi.mocked(createCollectionQuery).mockRejectedValue(new Error("db down"));
    await expect(createCollection(INPUT)).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
