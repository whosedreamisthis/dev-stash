import { TryDemoButton } from "@/components/auth/TryDemoButton";

// Shown at the top of the sign-in and register cards so visitors can skip signing up
export function DemoAccessPrompt() {
  return (
    // A gap rather than space-y, since the button's form uses display: contents and can't take a margin
    <div className="flex flex-col gap-3">
      <TryDemoButton size="large" className="w-full" />
      <p className="text-center text-xs text-muted-foreground">
        No sign-up needed: explore a Pro demo account with sample data.
      </p>
    </div>
  );
}
