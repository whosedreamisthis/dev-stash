"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { signInSchema } from "@/lib/validations/auth";

export interface SignInResult {
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

export async function signInWithGitHub(formData: FormData) {
  await signIn("github", { redirectTo: getRedirectTo(formData.get("callbackUrl")) });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/sign-in" });
}
