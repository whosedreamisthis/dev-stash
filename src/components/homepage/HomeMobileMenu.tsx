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

interface HomeMobileMenuProps {
  sectionLinks: { label: string; href: string }[];
  showSignIn: boolean;
}

// Section links (and Sign In) for small screens, where the header hides them
export function HomeMobileMenu({ sectionLinks, showSignIn }: HomeMobileMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-lg" aria-label="Open menu" className="md:hidden" />}
      >
        <Menu />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {sectionLinks.map((link) => (
          <DropdownMenuItem key={link.href} render={<a href={link.href} />}>
            {link.label}
          </DropdownMenuItem>
        ))}
        {showSignIn && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/sign-in" />}>Sign In</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
