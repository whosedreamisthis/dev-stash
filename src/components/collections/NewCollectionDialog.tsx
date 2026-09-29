"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { NewCollectionForm } from "@/components/collections/NewCollectionForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { COMPACT_BUTTON, COMPACT_LABEL } from "@/lib/compact-button";

interface NewCollectionDialogProps {
  // Shows only the icon below the lg breakpoint; the label stays for screen readers
  compact?: boolean;
}

export function NewCollectionDialog({ compact }: NewCollectionDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" className={compact ? COMPACT_BUTTON : undefined} />}
      >
        <FolderPlus />
        <span className={compact ? COMPACT_LABEL : undefined}>New Collection</span>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>Group related items of any type together.</DialogDescription>
        </DialogHeader>
        <NewCollectionForm onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
