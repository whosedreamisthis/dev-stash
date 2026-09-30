import { beforeEach, describe, expect, it, vi } from "vitest";
import { after } from "next/server";
import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";
import { deleteExpiredDemoUsers } from "@/lib/db/demo";
import { createUser } from "@/lib/db/users";
import { sendPasswordResetLink } from "@/lib/password-reset";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { deleteUploadedFile } from "@/lib/uploadthing";
import { isEmailVerificationEnabled, sendVerificationLink } from "@/lib/verification";
import {
  registerUser,
  requestPasswordReset,
  resendVerificationEmail,
  resetPasswordWithToken,
  signInWithCredentials,
  signInWithGitHub,
  startDemo,
} from "@/actions/auth";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/db/demo", () => ({ deleteExpiredDemoUsers: vi.fn() }));
vi.mock("@/lib/uploadthing", () => ({ deleteUploadedFile: vi.fn() }));
// next-auth can't load outside Next.js, and only its error classes are used here
vi.mock("next-auth", () => ({
  AuthError: class extends Error {},
  CredentialsSignin: class extends Error {},
}));
vi.mock("@/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  EMAIL_NOT_VERIFIED: "email_not_verified",
  RATE_LIMITED: "rate_limited",
}));
vi.mock("@/lib/db/users", () => ({ createUser: vi.fn() }));
vi.mock("@/lib/password-reset", () => ({
  resetPassword: vi.fn(),
  sendPasswordResetLink: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(),
  getRateLimitMessage: vi.fn(() => "Too many attempts. Please try again in 60 minutes."),
}));
vi.mock("@/lib/verification", () => ({
  isEmailVerificationEnabled: vi.fn(),
  resendVerificationLink: vi.fn(),
  sendVerificationLink: vi.fn(),
}));

const VALUES = {
  name: " Ada ",
  email: " Ada@Example.com ",
  password: "correct-horse",
  confirmPassword: "correct-horse",
};

const USER = { id: "user-1", name: "Ada", email: "ada@example.com" };

describe("registerUser", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getClientIp).mockReturnValue("1.2.3.4");
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, reset: 0 } as never);
    vi.mocked(isEmailVerificationEnabled).mockReturnValue(true);
  });

  it("rejects invalid input without creating a user", async () => {
    const result = await registerUser({ ...VALUES, confirmPassword: "mismatch" });
    expect(result).toEqual({ success: false, error: "Passwords do not match" });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("creates the user with normalized input and sends the verification email", async () => {
    vi.mocked(createUser).mockResolvedValue(USER as never);
    vi.mocked(sendVerificationLink).mockResolvedValue(true as never);
    await expect(registerUser(VALUES)).resolves.toEqual({
      success: true,
      data: { verificationRequired: true, emailSent: true },
    });
    expect(checkRateLimit).toHaveBeenCalledWith("register", "1.2.3.4");
    expect(createUser).toHaveBeenCalledWith("Ada", "ada@example.com", "correct-horse");
    expect(sendVerificationLink).toHaveBeenCalledWith("ada@example.com");
  });

  it("keeps the account when the verification email fails", async () => {
    vi.mocked(createUser).mockResolvedValue(USER as never);
    vi.mocked(sendVerificationLink).mockRejectedValue(new Error("resend down"));
    await expect(registerUser(VALUES)).resolves.toEqual({
      success: true,
      data: { verificationRequired: true, emailSent: false },
    });
  });

  it("skips the email when verification is turned off", async () => {
    vi.mocked(isEmailVerificationEnabled).mockReturnValue(false);
    vi.mocked(createUser).mockResolvedValue(USER as never);
    await expect(registerUser(VALUES)).resolves.toEqual({
      success: true,
      data: { verificationRequired: false, emailSent: false },
    });
    expect(sendVerificationLink).not.toHaveBeenCalled();
  });

  it("reports an email that already has an account", async () => {
    vi.mocked(createUser).mockResolvedValue(null);
    await expect(registerUser(VALUES)).resolves.toEqual({
      success: false,
      error: "A user with this email already exists",
    });
  });

  it("stops rate-limited addresses before creating a user", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, reset: 0 } as never);
    await expect(registerUser(VALUES)).resolves.toEqual({
      success: false,
      error: "Too many attempts. Please try again in 60 minutes.",
      rateLimited: true,
    });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("skips the rate limit when the IP is unknown", async () => {
    vi.mocked(getClientIp).mockReturnValue(null);
    vi.mocked(createUser).mockResolvedValue(USER as never);
    vi.mocked(sendVerificationLink).mockResolvedValue(true as never);
    await expect(registerUser(VALUES)).resolves.toMatchObject({ success: true });
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns an error when creating the user fails", async () => {
    vi.mocked(createUser).mockRejectedValue(new Error("db down"));
    await expect(registerUser(VALUES)).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

function form(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("DEMO_ONLY_MODE", () => {
  const DEMO_ONLY = {
    success: false,
    error: "Sign-in and registration aren't available in this demo. Use Try the Demo instead.",
    demoOnly: true,
  };

  beforeEach(() => {
    vi.stubEnv("DEMO_ONLY_MODE", "true");
  });

  it("refuses credentials sign-in", async () => {
    const result = await signInWithCredentials(
      { success: false },
      form({ email: "ada@example.com", password: "correct-horse" })
    );
    expect(result).toEqual(DEMO_ONLY);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("refuses GitHub sign-in", async () => {
    await expect(signInWithGitHub({ success: false }, form({}))).resolves.toEqual(DEMO_ONLY);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("refuses registration", async () => {
    await expect(registerUser(VALUES)).resolves.toEqual(DEMO_ONLY);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("refuses password reset emails", async () => {
    const result = await requestPasswordReset(
      { success: false },
      form({ email: "ada@example.com" })
    );
    expect(result).toEqual(DEMO_ONLY);
    expect(sendPasswordResetLink).not.toHaveBeenCalled();
  });

  it("refuses resetting a password and resending verification", async () => {
    const reset = await resetPasswordWithToken(
      { success: false },
      form({ token: "t", password: "correct-horse", confirmPassword: "correct-horse" })
    );
    expect(reset).toEqual(DEMO_ONLY);
    await expect(resendVerificationEmail("ada@example.com")).resolves.toEqual(DEMO_ONLY);
  });

  it("leaves GitHub sign-in working when the flag is off", async () => {
    vi.stubEnv("DEMO_ONLY_MODE", "false");
    await expect(signInWithGitHub({ success: false }, form({}))).resolves.toEqual({
      success: true,
    });
    expect(signIn).toHaveBeenCalledWith("github", { redirectTo: "/dashboard" });
  });
});

describe("startDemo", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("signs in with the demo provider and opens the dashboard", async () => {
    await expect(startDemo()).resolves.toEqual({ success: true });
    expect(signIn).toHaveBeenCalledWith("demo", { redirectTo: "/dashboard" });
  });

  it("works in demo-only mode", async () => {
    vi.stubEnv("DEMO_ONLY_MODE", "true");
    await expect(startDemo()).resolves.toEqual({ success: true });
  });

  it("rethrows the redirect signIn uses on success", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    vi.mocked(signIn).mockRejectedValue(redirect);
    await expect(startDemo()).rejects.toBe(redirect);
  });

  it("reports rate-limited demo sign-ins", async () => {
    vi.mocked(signIn).mockRejectedValue(
      Object.assign(new CredentialsSignin(), { code: "rate_limited" })
    );
    await expect(startDemo()).resolves.toEqual({
      success: false,
      error: "Too many demo sign-ins. Please try again in an hour.",
      rateLimited: true,
    });
  });

  it("returns a generic error when creating the demo fails", async () => {
    vi.mocked(signIn).mockRejectedValue(new AuthError("db down"));
    await expect(startDemo()).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });

  it("cleans up expired demos and their files after the response", async () => {
    vi.mocked(deleteExpiredDemoUsers).mockResolvedValue(["key-1", "key-2"]);
    await startDemo();

    const cleanUp = vi.mocked(after).mock.calls[0][0] as () => Promise<void>;
    expect(deleteExpiredDemoUsers).not.toHaveBeenCalled();
    await cleanUp();
    expect(deleteUploadedFile).toHaveBeenCalledWith("key-1");
    expect(deleteUploadedFile).toHaveBeenCalledWith("key-2");
  });

  it("logs cleanup failures instead of throwing", async () => {
    vi.mocked(deleteExpiredDemoUsers).mockRejectedValue(new Error("db down"));
    await startDemo();

    const cleanUp = vi.mocked(after).mock.calls[0][0] as () => Promise<void>;
    await expect(cleanUp()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});
