import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";

interface AccountActionsProps {
  hasPassword: boolean;
}

export function AccountActions({ hasPassword }: AccountActionsProps) {
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
