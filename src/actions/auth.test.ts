import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUser } from "@/lib/db/users";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isEmailVerificationEnabled, sendVerificationLink } from "@/lib/verification";
import { registerUser } from "@/actions/auth";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
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
