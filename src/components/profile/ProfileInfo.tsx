import { Calendar, Mail } from "lucide-react";
import { UserAvatar } from "@/components/user/UserAvatar";
import type { ProfileUser } from "@/types/profile";

interface ProfileInfoProps {
  user: ProfileUser;
}

const JOINED_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function ProfileInfo({ user }: ProfileInfoProps) {
  // Initials fall back to the email when the user has no name
  const displayName = user.name ?? user.email ?? "User";

  return (
    <section className="flex flex-col gap-5 rounded-xl border bg-card p-6 sm:flex-row sm:items-center">
      <UserAvatar
        name={displayName}
        image={user.image}
        className="size-16 *:data-[slot=avatar-fallback]:text-xl"
      />
      <div className="min-w-0 space-y-1.5">
        <h2 className="truncate text-xl font-semibold">{displayName}</h2>
        {user.email && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4 shrink-0" />
            <span className="truncate">{user.email}</span>
          </p>
        )}
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="size-4 shrink-0" />
          Joined {JOINED_FORMAT.format(user.createdAt)}
        </p>
      </div>
    </section>
  );
}
