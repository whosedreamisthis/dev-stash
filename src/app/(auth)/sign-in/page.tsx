import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { GitHubAuthForm } from "@/components/auth/GitHubAuthForm";
import { SignInForm } from "@/components/auth/SignInForm";

// Errors Auth.js sends back to the sign-in page as ?error=...
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already registered. Sign in with your email and password.",
  AccessDenied: "Access was denied. Please try again.",
};

// Banners for ?registered=... (after sign-up) and ?verify=... (from the email link)
const SUCCESS_MESSAGES: Record<string, string> = {
  registered: "Account created. Check your email for a link to verify your address.",
  verified: "Email verified. You can sign in now.",
};

const NOTICE_ERROR_MESSAGES: Record<string, string> = {
  "email-failed":
    "Account created, but we couldn't send the verification email. Sign in to request a new link.",
  invalid: "This verification link is invalid or has already been used.",
  expired: "This verification link has expired. Sign in to request a new one.",
};

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const params = await searchParams;
  const callbackUrl = getParam(params.callbackUrl);
  const error = getParam(params.error);
  const registered = getParam(params.registered);
  const verify = getParam(params.verify);

  const successMessage =
    (registered === "1" && SUCCESS_MESSAGES.registered) ||
    (verify === "verified" && SUCCESS_MESSAGES.verified) ||
    undefined;
  const noticeError =
    (registered && NOTICE_ERROR_MESSAGES[registered]) ||
    (verify && NOTICE_ERROR_MESSAGES[verify]) ||
    undefined;

  return (
    <AuthCard
      title="Sign in to DevStash"
      description="Welcome back. Sign in to your account."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground hover:underline">
            Register
          </Link>
        </>
      }
    >
      {successMessage && (
        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
          {successMessage}
        </p>
      )}
      {noticeError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {noticeError}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {AUTH_ERROR_MESSAGES[error] ?? "Sign in failed. Please try again."}
        </p>
      )}

      <GitHubAuthForm label="Sign in with GitHub" callbackUrl={callbackUrl} />
      <SignInForm callbackUrl={callbackUrl} />
    </AuthCard>
  );
}
