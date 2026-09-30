import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";

interface AccountActionsProps {
  hasPassword: boolean;
  // Demo accounts have no password and are deleted automatically
  isDemo: boolean;
}

export function AccountActions({ hasPassword, isDemo }: AccountActionsProps) {
  if (isDemo) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-medium">Demo account</h3>
          <p className="text-sm text-muted-foreground">
            This temporary account and everything in it is deleted automatically after 24 hours.
            Changing the password and deleting the account are turned off for demos.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Account</h2>
      {hasPassword && (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-medium">Password</h3>
            <p className="text-sm text-muted-foreground">
              Change the password you use to sign in.
            </p>
          </div>
          <ChangePasswordDialog />
        </div>
      )}
      <div className="flex flex-col gap-4 rounded-xl border border-destructive/40 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-medium">Delete account</h3>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all of its data.
          </p>
        </div>
        <DeleteAccountDialog />
      </div>
    </section>
  );
}
