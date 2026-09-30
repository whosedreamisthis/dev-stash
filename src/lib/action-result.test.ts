import { describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { GENERIC_ERROR, runUserAction } from "@/lib/action-result";
import { NOT_SIGNED_IN_ERROR } from "@/lib/session";
import { idSchema } from "@/lib/validations/ids";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const mockAuth = vi.mocked(auth as () => Promise<unknown>);

function run(fn: (userId: string, id: string) => Promise<{ id: string } | null>, input = "item-1") {
  return runUserAction({
    schema: idSchema,
    input,
    notFound: "Item not found.",
    logLabel: "Testing",
    run: fn,
  });
}

describe("runUserAction", () => {
  it("returns the run result for the signed-in user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const fn = vi.fn(async (_userId: string, id: string) => ({ id }));

    await expect(run(fn, "  item-1 ")).resolves.toEqual({ success: true, data: { id: "item-1" } });
    expect(fn).toHaveBeenCalledWith("user-1", "item-1");
  });

  it("returns the not-signed-in error without running", async () => {
    mockAuth.mockResolvedValue(null);
    const fn = vi.fn();

    await expect(run(fn)).resolves.toEqual({ success: false, error: NOT_SIGNED_IN_ERROR });
    expect(fn).not.toHaveBeenCalled();
  });

  it("returns the not-found error for invalid input without running", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const fn = vi.fn();

    await expect(run(fn, "  ")).resolves.toEqual({ success: false, error: "Item not found." });
    expect(fn).not.toHaveBeenCalled();
  });

  it("returns the not-found error when the run finds nothing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    await expect(run(async () => null)).resolves.toEqual({
      success: false,
      error: "Item not found.",
    });
  });

  it("logs and returns the generic error when the run throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = new Error("db down");

    await expect(
      run(async () => {
        throw failure;
      })
    ).resolves.toEqual({ success: false, error: GENERIC_ERROR });
    expect(consoleError).toHaveBeenCalledWith("Testing failed:", failure);
  });
});
