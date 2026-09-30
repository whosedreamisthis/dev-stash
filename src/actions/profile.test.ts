import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth, signOut } from "@/auth";
import { changePassword, deleteAccount } from "@/lib/account";
import { changeUserPassword, deleteUserAccount } from "@/actions/profile";

vi.mock("@/auth", () => ({ auth: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/account", () => ({ changePassword: vi.fn(), deleteAccount: vi.fn() }));

// auth() is overloaded (it also wraps middleware), so narrow it to the session getter
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

function signIn(userId = "user-1") {
  mockAuth.mockResolvedValue({ user: { id: userId }, expires: "" } as Session);
}

function signInDemo() {
  mockAuth.mockResolvedValue({ user: { id: "demo-1", isDemo: true }, expires: "" } as Session);
}

const DEMO_ACCOUNT_ERROR = "This isn't available on the demo account.";

function passwordForm(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const VALID_FORM = {
  currentPassword: "old-password",
  password: "new-password",
  confirmPassword: "new-password",
};

describe("changeUserPassword", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await changeUserPassword({ success: false }, passwordForm(VALID_FORM));
    expect(result).toEqual({ success: false, error: "You must be signed in." });
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("refuses demo accounts", async () => {
    signInDemo();
    const result = await changeUserPassword({ success: false }, passwordForm(VALID_FORM));
    expect(result).toEqual({ success: false, error: DEMO_ACCOUNT_ERROR });
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    signIn();
    const result = await changeUserPassword(
      { success: false },
      passwordForm({ ...VALID_FORM, confirmPassword: "mismatch" })
    );
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.confirmPassword).toBe("Passwords do not match");
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("changes the password for the session user", async () => {
    signIn("user-42");
    vi.mocked(changePassword).mockResolvedValue("changed");
    const result = await changeUserPassword({ success: false }, passwordForm(VALID_FORM));
    expect(result).toEqual({ success: true });
    expect(changePassword).toHaveBeenCalledWith("user-42", "old-password", "new-password");
  });

  it("reports an incorrect current password", async () => {
    signIn();
    vi.mocked(changePassword).mockResolvedValue("incorrect");
    const result = await changeUserPassword({ success: false }, passwordForm(VALID_FORM));
    expect(result.fieldErrors?.currentPassword).toBe("Current password is incorrect");
  });

  it("returns a generic error when saving fails", async () => {
    signIn();
    vi.mocked(changePassword).mockRejectedValue(new Error("db down"));
    const result = await changeUserPassword({ success: false }, passwordForm(VALID_FORM));
    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("deleteUserAccount", () => {
  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(deleteUserAccount()).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(deleteAccount).not.toHaveBeenCalled();
  });

  it("refuses demo accounts", async () => {
    signInDemo();
    await expect(deleteUserAccount()).resolves.toEqual({
      success: false,
      error: DEMO_ACCOUNT_ERROR,
    });
    expect(deleteAccount).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("deletes the session user's account and signs out", async () => {
    signIn("user-42");
    await deleteUserAccount();
    expect(deleteAccount).toHaveBeenCalledWith("user-42");
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/sign-in" });
  });

  it("returns a generic error and stays signed in when deleting fails", async () => {
    signIn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(deleteAccount).mockRejectedValue(new Error("db down"));
    await expect(deleteUserAccount()).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    expect(signOut).not.toHaveBeenCalled();
  });
});
