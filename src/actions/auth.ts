"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { AuthError, CredentialsSignin } from "next-auth";
import { EMAIL_NOT_VERIFIED, RATE_LIMITED, signIn, signOut } from "@/auth";
import { GENERIC_ERROR } from "@/lib/action-result";
import { deleteExpiredDemoUsers } from "@/lib/db/demo";
import { createUser } from "@/lib/db/users";
import { DEMO_ONLY_ERROR, DEMO_PROVIDER_ID, isDemoOnlyMode } from "@/lib/demo";
import { deleteUploadedFile } from "@/lib/uploadthing";
import { resetPassword, sendPasswordResetLink } from "@/lib/password-reset";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitMessage,
  type RateLimitName,
} from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signInSchema,
  type RegisterInput,
} from "@/lib/validations/auth";
import { firstIssueMessage, toFirstFieldErrors } from "@/lib/validations/errors";
import {
  isEmailVerificationEnabled,
  resendVerificationLink,
  sendVerificationLink,
} from "@/lib/verification";
import type { ActionResult } from "@/types/actions";

interface AuthActionResult<T = undefined> extends ActionResult<T> {
  rateLimited?: boolean;
  // Refused because DEMO_ONLY_MODE turns regular sign-in and registration off
  demoOnly?: boolean;
}

export type GitHubSignInResult = AuthActionResult;

export type StartDemoResult = AuthActionResult;

const DEMO_ONLY_RESULT = { success: false, error: DEMO_ONLY_ERROR, demoOnly: true } as const;

export interface SignInResult extends AuthActionResult {
  emailNotVerified?: boolean;
}

export type ResendVerificationResult = AuthActionResult;

export type ForgotPasswordResult = AuthActionResult;

export type RegisterResult = AuthActionResult<{
  verificationRequired: boolean;
  emailSent: boolean;
}>;

export interface ResetPasswordActionResult extends AuthActionResult {
  fieldErrors?: { password?: string; confirmPassword?: string };
}

const RESET_ERROR_MESSAGES = {
  invalid: "This reset link is invalid or has already been used. Request a new one.",
  expired: "This reset link has expired. Request a new one.",
} as const;

const DEFAULT_REDIRECT = "/dashboard";

// Only allow same-site relative paths so callbackUrl can't redirect off-site
function getRedirectTo(callbackUrl: FormDataEntryValue | null) {
  if (typeof callbackUrl !== "string") return DEFAULT_REDIRECT;
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }
  return callbackUrl;
}

// Keyed by IP, plus an extra identifier where given. IP-only limits are skipped
// when the IP is unknown so every client doesn't share one bucket
async function checkActionRateLimit(name: RateLimitName, identifier?: string) {
  const ip = getClientIp(await headers());
  const key = identifier ? `${ip ?? "unknown"}:${identifier}` : ip;
  if (!key) return null;

  const { success, reset } = await checkRateLimit(name, key);
  return success
    ? null
    : { success: false, error: getRateLimitMessage(reset), rateLimited: true };
}

// Turns a failed sign-in into a message; null for errors that aren't AuthErrors,
// such as the redirect signIn throws on success
function getSignInError(error: unknown): SignInResult | null {
  if (error instanceof CredentialsSignin && error.code === RATE_LIMITED) {
    return {
      success: false,
      error: "Too many attempts. Please try again in 15 minutes.",
      rateLimited: true,
    };
  }
  if (error instanceof CredentialsSignin && error.code === EMAIL_NOT_VERIFIED) {
    return {
      success: false,
      error: "Please verify your email before signing in. Check your inbox for the link.",
      emailNotVerified: true,
    };
  }
  if (error instanceof AuthError) {
    return {
      success: false,
      error:
        error.type === "CredentialsSignin"
          ? "Invalid email or password"
          : GENERIC_ERROR,
    };
  }
  return null;
}

export async function signInWithCredentials(
  _prevState: SignInResult,
  formData: FormData,
): Promise<SignInResult> {
  if (isDemoOnlyMode()) return DEMO_ONLY_RESULT;

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { success: false, error: firstIssueMessage(parsed.error, "Invalid input") };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: getRedirectTo(formData.get("callbackUrl")),
    });
    return { success: true };
  } catch (error) {
    // signIn redirects by throwing, so anything that isn't an AuthError is rethrown
    const result = getSignInError(error);
    if (result) return result;
    throw error;
  }
}

export async function registerUser(values: RegisterInput): Promise<RegisterResult> {
  if (isDemoOnlyMode()) return DEMO_ONLY_RESULT;

  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: firstIssueMessage(parsed.error, "Invalid input") };
  }

  const { name, email, password } = parsed.data;

  try {
    // Limits scripted email enumeration and mass sign-ups from one address
    const limited = await checkActionRateLimit("register");
    if (limited) return limited;

    const user = await createUser(name, email, password);
    if (!user) return { success: false, error: "A user with this email already exists" };

    const verificationRequired = isEmailVerificationEnabled();

    // The account stays created if the email fails; the user can request a new link
    const emailSent = verificationRequired
      ? await sendVerificationLink(email).catch((error: unknown) => {
          console.error("Sending verification email failed:", error);
          return false;
        })
      : false;

    return { success: true, data: { verificationRequired, emailSent } };
  } catch (error) {
    console.error("Registration failed:", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

// Always reports success so the response doesn't reveal which emails have accounts
export async function resendVerificationEmail(
  email: string,
): Promise<ResendVerificationResult> {
  if (isDemoOnlyMode()) return DEMO_ONLY_RESULT;

  const parsed = resendVerificationSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: firstIssueMessage(parsed.error, "Invalid email") };
  }

  try {
    const limited = await checkActionRateLimit("resendVerification", parsed.data.email);
    if (limited) return limited;

    await resendVerificationLink(parsed.data.email);
    return { success: true };
  } catch (error) {
    console.error("Resending verification email failed:", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

// Always reports success so the response doesn't reveal which emails have accounts
export async function requestPasswordReset(
  _prevState: ForgotPasswordResult,
  formData: FormData,
): Promise<ForgotPasswordResult> {
  if (isDemoOnlyMode()) return DEMO_ONLY_RESULT;

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: firstIssueMessage(parsed.error, "Invalid email") };
  }

  try {
    const limited = await checkActionRateLimit("forgotPassword");
    if (limited) return limited;

    await sendPasswordResetLink(parsed.data.email);
    return { success: true };
  } catch (error) {
    console.error("Requesting password reset failed:", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function resetPasswordWithToken(
  _prevState: ResetPasswordActionResult,
  formData: FormData,
): Promise<ResetPasswordActionResult> {
  if (isDemoOnlyMode()) return DEMO_ONLY_RESULT;

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const { token, ...fieldErrors } = toFirstFieldErrors<
      "token" | "password" | "confirmPassword"
    >(parsed.error);
    if (token) return { success: false, error: RESET_ERROR_MESSAGES.invalid };
    return { success: false, fieldErrors };
  }

  let result;
  try {
    const limited = await checkActionRateLimit("resetPassword");
    if (limited) return limited;

    result = await resetPassword(parsed.data.token, parsed.data.password);
  } catch (error) {
    console.error("Resetting password failed:", error);
    return { success: false, error: GENERIC_ERROR };
  }

  if (result !== "reset") return { success: false, error: RESET_ERROR_MESSAGES[result] };
  // Outside the try block because redirect works by throwing
  redirect("/sign-in?reset=success");
}

export async function signInWithGitHub(
  _prevState: GitHubSignInResult,
  formData: FormData,
): Promise<GitHubSignInResult> {
  if (isDemoOnlyMode()) return DEMO_ONLY_RESULT;

  await signIn("github", { redirectTo: getRedirectTo(formData.get("callbackUrl")) });
  return { success: true };
}

// Deletes expired demo accounts and their uploaded files. Best effort: whatever
// fails is retried on the next demo sign-in
async function cleanUpExpiredDemos() {
  try {
    const fileKeys = await deleteExpiredDemoUsers();
    await Promise.all(fileKeys.map((key) => deleteUploadedFile(key)));
  } catch (error) {
    console.error("Cleaning up demo accounts failed:", error);
  }
}

// Signs the visitor into a new temporary demo account and opens the dashboard
export async function startDemo(): Promise<StartDemoResult> {
  // After the response, so the cleanup doesn't slow down the sign-in
  after(cleanUpExpiredDemos);

  try {
    await signIn(DEMO_PROVIDER_ID, { redirectTo: DEFAULT_REDIRECT });
    return { success: true };
  } catch (error) {
    // signIn redirects by throwing, so anything that isn't an AuthError is rethrown
    const result = getSignInError(error);
    if (!result) throw error;
    if (result.rateLimited) {
      return { ...result, error: "Too many demo sign-ins. Please try again in an hour." };
    }
    // Auth.js wraps errors thrown in authorize, so the cause holds the real failure
    console.error("Starting demo failed:", error instanceof Error ? (error.cause ?? error) : error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function signOutUser() {
  await signOut({ redirectTo: "/sign-in" });
}
