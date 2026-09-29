"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { CommandPalette } from "@/components/search/CommandPalette";
import { EditorPreferencesProvider } from "@/components/settings/EditorPreferencesContext";
import { useCommandPaletteShortcut } from "@/hooks/useCommandPaletteShortcut";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { SidebarData } from "@/types/sidebar";

interface DashboardShellProps {
  sidebar: SidebarData;
  children: React.ReactNode;
}

export function DashboardShell({ sidebar, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  useCommandPaletteShortcut(() => setSearchOpen((prev) => !prev));

  return (
    // Around the whole shell, so editors in the drawer and dialogs get the preferences
    <EditorPreferencesProvider initialPreferences={sidebar.editorPreferences}>
      <div className="flex h-screen overflow-hidden">
        <aside
          className={cn(
            "hidden shrink-0 overflow-hidden border-r transition-[width] duration-200 md:block",
            sidebarOpen ? "w-64" : "w-0 border-r-0"
          )}
        >
          <Sidebar data={sidebar} />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="gap-0 p-0 data-[side=left]:w-64 md:hidden">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar data={sidebar} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Wraps the top bar too, so the command palette can open items in the drawer */}
        <ItemDrawerProvider>
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              onOpenMobileSidebar={() => setMobileOpen(true)}
              onOpenSearch={() => setSearchOpen(true)}
            />
            <main className="scrollbar-thin flex-1 overflow-y-auto p-6">{children}</main>
          </div>
          <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
        </ItemDrawerProvider>
      </div>
    </EditorPreferencesProvider>
  );
}
