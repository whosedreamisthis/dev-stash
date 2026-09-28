import type { PaginatedResult } from "@/types/pagination";

export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;
export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

// A gap between page numbers, rendered as "…"
export type PageLink = number | "ellipsis";

// Reads the ?page= search param; anything that isn't a positive whole number is page 1
export function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

export function getTotalPages(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}

// Prisma skip/take for one page
export function getPageRange(page: number, perPage: number) {
  return { skip: (page - 1) * perPage, take: perPage };
}

// The first and last pages, the current page and its neighbours, with gaps
// in between, e.g. 1 … 4 5 6 … 10. A gap of one page shows the page instead.
export function getPageLinks(current: number, totalPages: number): PageLink[] {
  const pages = new Set([1, totalPages, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const links: PageLink[] = [];
  for (const page of sorted) {
    const previous = links.at(-1);
    if (typeof previous === "number" && page - previous === 2)
      links.push(previous + 1);
    else if (typeof previous === "number" && page - previous > 2)
      links.push("ellipsis");
    links.push(page);
  }
  return links;
}

// Counts and fetches a page in parallel. When the page is past the end (e.g.
// after deleting the last item on it), the last page is fetched instead.
export async function paginate<T>(
  page: number,
  perPage: number,
  count: () => Promise<number>,
  fetchPage: (range: { skip: number; take: number }) => Promise<T[]>,
): Promise<PaginatedResult<T>> {
  const [total, items] = await Promise.all([
    count(),
    fetchPage(getPageRange(page, perPage)),
  ]);
  const totalPages = getTotalPages(total, perPage);
  if (page <= totalPages) return { items, total, page, totalPages };

  const lastPageItems = await fetchPage(getPageRange(totalPages, perPage));
  return { items: lastPageItems, total, page: totalPages, totalPages };
}

// Page 1 is the bare path, so it matches the links in the sidebar
export function getPageHref(basePath: string, page: number): string {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}
