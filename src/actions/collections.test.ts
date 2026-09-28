import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  updateCollection as updateCollectionQuery,
} from "@/lib/db/collections";
import { createCollection, deleteCollection, updateCollection } from "@/actions/collections";
import type { CollectionSummary } from "@/types/collections";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/collections", () => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
}));

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

describe("updateCollection", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(updateCollection("c1", INPUT)).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(updateCollectionQuery).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    signIn();
    const result = await updateCollection("c1", { name: "", description: null });
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.name).toBe("Name is required");
    expect(updateCollectionQuery).not.toHaveBeenCalled();
  });

  it("updates the parsed input for the session user", async () => {
    signIn("user-42");
    const updated = { id: "c1", name: "React Patterns" } as CollectionSummary;
    vi.mocked(updateCollectionQuery).mockResolvedValue(updated);
    await expect(updateCollection("c1", INPUT)).resolves.toEqual({ success: true, data: updated });
    expect(updateCollectionQuery).toHaveBeenCalledWith("user-42", "c1", {
      name: "React Patterns",
      description: null,
    });
  });

  it("returns not found when the collection isn't the user's", async () => {
    signIn();
    vi.mocked(updateCollectionQuery).mockResolvedValue(null);
    await expect(updateCollection("c1", INPUT)).resolves.toEqual({
      success: false,
      error: "Collection not found.",
    });
  });

  it("returns a generic error when updating fails", async () => {
    signIn();
    vi.mocked(updateCollectionQuery).mockRejectedValue(new Error("db down"));
    await expect(updateCollection("c1", INPUT)).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("deleteCollection", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(deleteCollection("c1")).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(deleteCollectionQuery).not.toHaveBeenCalled();
  });

  it("rejects an empty ID without querying", async () => {
    signIn();
    await expect(deleteCollection("  ")).resolves.toEqual({
      success: false,
      error: "Collection not found.",
    });
    expect(deleteCollectionQuery).not.toHaveBeenCalled();
  });

  it("deletes the session user's collection", async () => {
    signIn("user-42");
    vi.mocked(deleteCollectionQuery).mockResolvedValue(true);
    await expect(deleteCollection("c1")).resolves.toEqual({ success: true, data: { id: "c1" } });
    expect(deleteCollectionQuery).toHaveBeenCalledWith("user-42", "c1");
  });

  it("returns not found when nothing was deleted", async () => {
    signIn();
    vi.mocked(deleteCollectionQuery).mockResolvedValue(false);
    await expect(deleteCollection("c1")).resolves.toEqual({
      success: false,
      error: "Collection not found.",
    });
  });

  it("returns a generic error when deleting fails", async () => {
    signIn();
    vi.mocked(deleteCollectionQuery).mockRejectedValue(new Error("db down"));
    await expect(deleteCollection("c1")).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
