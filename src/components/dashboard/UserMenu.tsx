"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { signOutUser } from "@/actions/auth";
import { UserAvatar } from "@/components/user/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SidebarUser } from "@/types/sidebar";

interface UserMenuProps {
  user: SidebarUser;
  onNavigate?: () => void;
}

export function UserMenu({ user, onNavigate }: UserMenuProps) {
  const displayName = user.name ?? user.email ?? "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md p-1 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring">
        <UserAvatar name={displayName} image={user.image} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {user.email && (
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="w-56">
        <DropdownMenuItem render={<Link href="/profile" onClick={onNavigate} />}>
          <User />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOutUser()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
