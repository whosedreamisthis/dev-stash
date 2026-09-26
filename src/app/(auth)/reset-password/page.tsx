import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getResetTokenStatus } from "@/lib/password-reset";

const TOKEN_ERROR_MESSAGES = {
  invalid: "This reset link is invalid or has already been used.",
  expired: "This reset link has expired.",
} as const;

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { token } = await searchParams;
  const status = typeof token === "string" ? await getResetTokenStatus(token) : "invalid";

  return (
    <AuthCard
      title="Reset your password"
      description="Choose a new password for your account."
      footer={
        <Link href="/sign-in" className="font-medium text-foreground hover:underline">
          Back to sign in
        </Link>
      }
    >
      {status === "valid" && typeof token === "string" ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4">
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {TOKEN_ERROR_MESSAGES[status === "expired" ? "expired" : "invalid"]}
          </p>
          <Link
            href="/forgot-password"
            className="block text-center text-sm font-medium hover:underline"
          >
            Request a new link
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
