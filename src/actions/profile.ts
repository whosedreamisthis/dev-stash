"use server";

import { z } from "zod";
import { auth, signOut } from "@/auth";
import { changePassword, deleteAccount } from "@/lib/account";
import { changePasswordSchema } from "@/lib/validations/auth";

export interface ChangePasswordActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: { currentPassword?: string; password?: string; confirmPassword?: string };
}

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

const CHANGE_PASSWORD_ERRORS = {
  incorrect: { fieldErrors: { currentPassword: "Current password is incorrect" } },
  no_password: { error: "This account signs in with GitHub and has no password." },
} as const;

export async function changeUserPassword(
  _prevState: ChangePasswordActionResult,
  formData: FormData,
): Promise<ChangePasswordActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "You must be signed in." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      success: false,
      fieldErrors: {
        currentPassword: fieldErrors.currentPassword?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      },
    };
  }

  try {
    const result = await changePassword(
      userId,
      parsed.data.currentPassword,
      parsed.data.password,
    );
    if (result !== "changed") return { success: false, ...CHANGE_PASSWORD_ERRORS[result] };
    return { success: true };
  } catch (error) {
    console.error("Changing password failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function deleteUserAccount(): Promise<DeleteAccountResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "You must be signed in." };

  try {
    await deleteAccount(userId);
  } catch (error) {
    console.error("Deleting account failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  // Outside the try block because signOut redirects by throwing
  await signOut({ redirectTo: "/sign-in" });
  return { success: true };
}
