import { FolderPlus, PanelLeft, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export function TopBar({ onToggleSidebar, onOpenMobileSidebar }: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="hidden md:inline-flex"
      >
        <PanelLeft />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenMobileSidebar}
        aria-label="Open sidebar"
        className="md:hidden"
      >
        <PanelLeft />
      </Button>
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search items..."
          className="pr-12 pl-8"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
          ⌘K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline">
          <FolderPlus />
          New Collection
        </Button>
        <Button>
          <Plus />
          New Item
        </Button>
      </div>
    </header>
  );
}
