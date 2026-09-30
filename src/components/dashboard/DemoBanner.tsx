import { Info } from "lucide-react";
import { signOutUser } from "@/actions/auth";

// Shown above the top bar while a visitor explores a temporary demo account
export function DemoBanner() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b bg-violet-500/10 px-4 py-1.5 text-center text-xs text-violet-700 sm:text-sm dark:text-violet-200">
      <Info aria-hidden className="size-4 shrink-0" />
      <span>You&apos;re exploring a demo account. Changes are temporary.</span>
      <form action={signOutUser}>
        <button
          type="submit"
          className="cursor-pointer font-medium underline underline-offset-4 hover:text-violet-900 dark:hover:text-white"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
