"use server";

import { signOut } from "@/auth";
import { changePassword, deleteAccount } from "@/lib/account";
import { GENERIC_ERROR } from "@/lib/action-result";
import { DEMO_ACCOUNT_ERROR } from "@/lib/demo";
import { getSessionUser, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import { changePasswordSchema } from "@/lib/validations/auth";
import { toFirstFieldErrors } from "@/lib/validations/errors";
import type { ActionResult } from "@/types/actions";

type ChangePasswordField = "currentPassword" | "password" | "confirmPassword";

export interface ChangePasswordActionResult extends ActionResult {
  rateLimited?: boolean;
  fieldErrors?: Partial<Record<ChangePasswordField, string>>;
}

export type DeleteAccountResult = ActionResult;

const CHANGE_PASSWORD_ERRORS = {
  incorrect: { fieldErrors: { currentPassword: "Current password is incorrect" } },
  no_password: { error: "This account signs in with GitHub and has no password." },
  rate_limited: {
    error: "Too many attempts. Please try again in 15 minutes.",
    rateLimited: true,
  },
} as const;

export async function changeUserPassword(
  _prevState: ChangePasswordActionResult,
  formData: FormData,
): Promise<ChangePasswordActionResult> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: NOT_SIGNED_IN_ERROR };
  if (user.isDemo) return { success: false, error: DEMO_ACCOUNT_ERROR };
  const userId = user.id;

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: toFirstFieldErrors<ChangePasswordField>(parsed.error),
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
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function deleteUserAccount(): Promise<DeleteAccountResult> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: NOT_SIGNED_IN_ERROR };
  // Demo accounts are deleted by the cleanup, so every visitor keeps a working demo
  if (user.isDemo) return { success: false, error: DEMO_ACCOUNT_ERROR };

  try {
    await deleteAccount(user.id);
  } catch (error) {
    console.error("Deleting account failed:", error);
    return { success: false, error: GENERIC_ERROR };
  }

  // Outside the try block because signOut redirects by throwing
  await signOut({ redirectTo: "/sign-in" });
  return { success: true };
}
