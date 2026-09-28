"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { NewItemForm } from "@/components/items/NewItemForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ITEM_TYPE_LABELS } from "@/lib/item-fields";
import type { CreatableTypeSlug } from "@/lib/validations/items";

interface NewItemDialogProps {
  // Preselects this type and names it on the button, e.g. "New Snippet"
  defaultType?: CreatableTypeSlug;
}

export function NewItemDialog({ defaultType }: NewItemDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        New {defaultType ? ITEM_TYPE_LABELS[defaultType] : "Item"}
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>Choose a type and fill in the details.</DialogDescription>
        </DialogHeader>
        <NewItemForm defaultType={defaultType ?? "snippets"} onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
