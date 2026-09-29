import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { GitHubAuthForm } from "@/components/auth/GitHubAuthForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { HomeNav } from "@/components/homepage/HomeNav";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <>
      {/* Signed-in visitors were redirected above */}
      <HomeNav isSignedIn={false} page="register" />
      <AuthCard
        belowNav
        title="Create your account"
        description="Start collecting your snippets, prompts and more."
        footer={
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-foreground hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <GitHubAuthForm label="Sign up with GitHub" />
        <RegisterForm />
      </AuthCard>
    </>
  );
}
