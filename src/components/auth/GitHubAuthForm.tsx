import { signInWithGitHub } from "@/actions/auth";
import { Button } from "@/components/ui/button";

interface GitHubAuthFormProps {
  label: string;
  callbackUrl?: string;
}

// GitHub sign-in creates the account on first use, so this serves both sign-in and sign-up
export function GitHubAuthForm({ label, callbackUrl }: GitHubAuthFormProps) {
  return (
    <>
      <form action={signInWithGitHub}>
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
        <Button type="submit" variant="outline" size="lg" className="w-full">
          {label}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}
