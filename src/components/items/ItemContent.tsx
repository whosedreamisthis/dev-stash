import { CodeEditor } from "@/components/items/CodeEditor";
import { ItemFileContent } from "@/components/items/ItemFileContent";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { getSafeHttpUrl } from "@/lib/url";
import { LANGUAGE_TYPE_SLUGS, MARKDOWN_TYPE_SLUGS } from "@/lib/validations/items";
import type { ItemDetail } from "@/types/items";

// An item's main content in the drawer: a link, a file, or read-only code/Markdown
export function ItemContent({ item }: { item: ItemDetail }) {
  if (item.contentType === "URL") {
    const href = getSafeHttpUrl(item.url);
    if (!href) return <p className="break-all text-muted-foreground">{item.url}</p>;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-primary underline-offset-4 hover:underline"
      >
        {item.url}
      </a>
    );
  }

  if (item.contentType === "FILE") return <ItemFileContent item={item} />;

  if (!item.content) return <p className="text-muted-foreground">No content</p>;

  if (LANGUAGE_TYPE_SLUGS.has(item.type.slug)) {
    return (
      <CodeEditor value={item.content} language={item.language} readOnly ariaLabel="Content" />
    );
  }

  if (MARKDOWN_TYPE_SLUGS.has(item.type.slug)) {
    return <MarkdownEditor value={item.content} readOnly ariaLabel="Content" />;
  }

  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-sm leading-relaxed">
      <code>{item.content}</code>
    </pre>
  );
}
