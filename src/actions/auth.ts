"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { EMAIL_NOT_VERIFIED, signIn, signOut } from "@/auth";
import { resendVerificationSchema, signInSchema } from "@/lib/validations/auth";
import { resendVerificationLink } from "@/lib/verification";

export interface SignInResult {
  success: boolean;
  error?: string;
  emailNotVerified?: boolean;
}

export interface ResendVerificationResult {
  success: boolean;
  error?: string;
}

const DEFAULT_REDIRECT = "/dashboard";

// Only allow same-site relative paths so callbackUrl can't redirect off-site
function getRedirectTo(callbackUrl: FormDataEntryValue | null) {
  if (typeof callbackUrl !== "string") return DEFAULT_REDIRECT;
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }
  return callbackUrl;
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
    await resendVerificationLink(parsed.data.email);
    return { success: true };
  } catch (error) {
    console.error("Resending verification email failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function signInWithGitHub(formData: FormData) {
  await signIn("github", { redirectTo: getRedirectTo(formData.get("callbackUrl")) });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/sign-in" });
}
