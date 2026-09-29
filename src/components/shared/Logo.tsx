import Link from "next/link";
import { Layers } from "lucide-react";

interface LogoProps {
  onClick?: () => void;
}

// DevStash mark and name, linking to the homepage
export function Logo({ onClick }: LogoProps) {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-violet-600 text-white">
        <Layers className="size-4" />
      </span>
      <span className="text-lg font-semibold">DevStash</span>
    </Link>
  );
}
