"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SECTION_LINKS } from "@/lib/homepage-content";

interface HomeMobileMenuProps {
  isSignedIn: boolean;
}

// Section links (and Sign In) for small screens, where the header hides them
export function HomeMobileMenu({ isSignedIn }: HomeMobileMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-lg" aria-label="Open menu" className="md:hidden" />}
      >
        <Menu />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {SECTION_LINKS.map((link) => (
          <DropdownMenuItem key={link.href} render={<a href={link.href} />}>
            {link.label}
          </DropdownMenuItem>
        ))}
        {!isSignedIn && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/sign-in" />}>Sign In</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
