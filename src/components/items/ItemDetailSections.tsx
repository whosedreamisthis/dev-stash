import { Calendar, FolderOpen, Tag } from "lucide-react";
import { ItemContent } from "@/components/items/ItemContent";
import type { ItemDetail } from "@/types/items";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

interface SectionProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="size-4" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function getContentTitle(item: ItemDetail) {
  if (item.contentType === "URL") return "URL";
  if (item.contentType === "FILE") return item.type.slug === "images" ? "Image" : "File";
  return "Content";
}

export function ItemDetailSections({ item }: { item: ItemDetail }) {
  return (
    <div className="flex flex-col gap-8">
      {item.description && (
        <Section title="Description">
          <p>{item.description}</p>
        </Section>
      )}
      <Section title={getContentTitle(item)}>
        <ItemContent item={item} />
      </Section>
      {item.tags.length > 0 && (
        <Section title="Tags" icon={Tag}>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-muted px-2.5 py-1 text-sm">
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}
      <ItemMetaSections item={item} />
    </div>
  );
}

// Collections and dates, which are read-only in both view and edit mode
export function ItemMetaSections({ item }: { item: ItemDetail }) {
  return (
    <>
      {item.collections.length > 0 && (
        <Section title="Collections" icon={FolderOpen}>
          <div className="flex flex-wrap gap-2">
            {item.collections.map((collection) => (
              <span key={collection.id} className="rounded-md border px-2.5 py-1 text-sm">
                {collection.name}
              </span>
            ))}
          </div>
        </Section>
      )}
      <Section title="Details" icon={Calendar}>
        <dl className="grid grid-cols-[auto_1fr] gap-y-2">
          <dt className="text-muted-foreground">Created</dt>
          <dd className="text-right">{dateFormatter.format(item.createdAt)}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="text-right">{dateFormatter.format(item.updatedAt)}</dd>
        </dl>
      </Section>
    </>
  );
}
