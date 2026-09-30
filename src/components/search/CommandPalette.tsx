"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useSearchData } from "@/hooks/useSearchData";
import { rememberCollection } from "@/lib/collection-preview";
import { formatItemCount } from "@/lib/format";
import { ITEM_TYPE_ICONS, ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { getCollectionKeywords, getItemKeywords, scoreSearchMatch } from "@/lib/search";
import type { CollectionSummary } from "@/types/collections";
import type { SearchItem } from "@/types/search";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Each result's value is its ID, so only its keywords are matched
function filterByKeywords(_value: string, search: string, keywords: string[] = []) {
  return scoreSearchMatch(keywords, search);
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { openItem } = useItemDrawer();
  const { data, error } = useSearchData(open);
  // Kept here, outside the dialog, so the search is still there when it reopens
  const [search, setSearch] = useState("");

  function selectItem(item: SearchItem) {
    onOpenChange(false);
    // The drawer takes its copy text from the full item it loads
    openItem({ ...item, copyText: null });
  }

  function selectCollection(collection: CollectionSummary) {
    onOpenChange(false);
    // Lets the collection page's loading state show the name and description
    rememberCollection(collection);
    router.push(`/collections/${collection.id}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search your items and collections"
      className="sm:max-w-xl"
    >
      <Command filter={filterByKeywords}>
        <CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search items and collections..."
          aria-label="Search items and collections"
        />
        <CommandList className="max-h-96">
          <CommandEmpty>{data ? "No results found." : (error ?? "Loading...")}</CommandEmpty>
          {data && data.items.length > 0 && (
            <CommandGroup heading="Items">
              {data.items.map((item) => (
                <SearchItemRow key={item.id} item={item} onSelect={() => selectItem(item)} />
              ))}
            </CommandGroup>
          )}
          {data && data.collections.length > 0 && (
            <CommandGroup heading="Collections">
              {data.collections.map((collection) => (
                <CommandItem
                  key={collection.id}
                  value={collection.id}
                  keywords={getCollectionKeywords(collection)}
                  onSelect={() => selectCollection(collection)}
                >
                  <Folder className="text-muted-foreground" />
                  <span className="truncate">{collection.name}</span>
                  <CommandShortcut className="tracking-normal">
                    {formatItemCount(collection.itemCount)}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

interface SearchItemRowProps {
  item: SearchItem;
  onSelect: () => void;
}

function SearchItemRow({ item, onSelect }: SearchItemRowProps) {
  const Icon = ITEM_TYPE_ICONS[item.type.icon];

  return (
    <CommandItem value={item.id} keywords={getItemKeywords(item)} onSelect={onSelect}>
      {Icon && (
        <Icon aria-label={item.type.name} className={ITEM_TYPE_TEXT_COLORS[item.type.slug]} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{item.title}</span>
        {item.contentPreview && (
          <span className="truncate text-xs text-muted-foreground">
            {item.contentPreview}
          </span>
        )}
      </div>
      <CommandShortcut className="tracking-normal">{item.type.name}</CommandShortcut>
    </CommandItem>
  );
}
