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

export function NewCollectionDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <FolderPlus />
        New Collection
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
