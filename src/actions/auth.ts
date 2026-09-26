"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError, CredentialsSignin } from "next-auth";
import { z } from "zod";
import { EMAIL_NOT_VERIFIED, RATE_LIMITED, signIn, signOut } from "@/auth";
import { resetPassword, sendPasswordResetLink } from "@/lib/password-reset";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitMessage,
  type RateLimitName,
} from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signInSchema,
} from "@/lib/validations/auth";
import { resendVerificationLink } from "@/lib/verification";

export interface SignInResult {
  success: boolean;
  error?: string;
  emailNotVerified?: boolean;
  rateLimited?: boolean;
}

export interface ResendVerificationResult {
  success: boolean;
  error?: string;
  rateLimited?: boolean;
}

export interface ForgotPasswordResult {
  success: boolean;
  error?: string;
  rateLimited?: boolean;
}

export interface ResetPasswordActionResult {
  success: boolean;
  error?: string;
  rateLimited?: boolean;
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

export async function signInWithCredentials(
  _prevState: SignInResult,
  formData: FormData,
): Promise<SignInResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: getRedirectTo(formData.get("callbackUrl")),
    });
    return { success: true };
  } catch (error) {
    // signIn redirects by throwing, so only AuthErrors are handled here
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
            : "Something went wrong. Please try again.",
      };
    }
    throw error;
  }
}

// Always reports success so the response doesn't reveal which emails have accounts
export async function resendVerificationEmail(
  email: string,
): Promise<ResendVerificationResult> {
  const parsed = resendVerificationSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  try {
    const limited = await checkActionRateLimit("resendVerification", parsed.data.email);
    if (limited) return limited;

    await resendVerificationLink(parsed.data.email);
    return { success: true };
  } catch (error) {
    console.error("Resending verification email failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Always reports success so the response doesn't reveal which emails have accounts
export async function requestPasswordReset(
  _prevState: ForgotPasswordResult,
  formData: FormData,
): Promise<ForgotPasswordResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  try {
    const limited = await checkActionRateLimit("forgotPassword");
    if (limited) return limited;

    await sendPasswordResetLink(parsed.data.email);
    return { success: true };
  } catch (error) {
    console.error("Requesting password reset failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function resetPasswordWithToken(
  _prevState: ResetPasswordActionResult,
  formData: FormData,
): Promise<ResetPasswordActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    if (fieldErrors.token) return { success: false, error: RESET_ERROR_MESSAGES.invalid };
    return {
      success: false,
      fieldErrors: {
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      },
    };
  }

  let result;
  try {
    const limited = await checkActionRateLimit("resetPassword");
    if (limited) return limited;

    result = await resetPassword(parsed.data.token, parsed.data.password);
  } catch (error) {
    console.error("Resetting password failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  if (result !== "reset") return { success: false, error: RESET_ERROR_MESSAGES[result] };
  // Outside the try block because redirect works by throwing
  redirect("/sign-in?reset=success");
}

export async function signInWithGitHub(formData: FormData) {
  await signIn("github", { redirectTo: getRedirectTo(formData.get("callbackUrl")) });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/sign-in" });
}
