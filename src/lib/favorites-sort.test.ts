import { describe, expect, it } from "vitest";
import { sortFavoriteCollections, sortFavoriteItems } from "@/lib/favorites-sort";
import type { CollectionItemType } from "@/types/collections";
import type { FavoriteCollection, FavoriteItem } from "@/types/favorites";

const type = (slug: string): CollectionItemType => ({
  id: slug,
  name: slug,
  slug,
  icon: "Code",
  color: "#000000",
});

const item = (title: string, slug: string, updatedAt: string): FavoriteItem => ({
  id: title,
  title,
  description: null,
  isPinned: false,
  isFavorite: true,
  createdAt: new Date("2026-01-01"),
  tags: [],
  type: type(slug),
  fileName: null,
  fileSize: null,
  copyText: null,
  updatedAt: new Date(updatedAt),
});

const collection = (name: string, updatedAt: string): FavoriteCollection => ({
  id: name,
  name,
  description: null,
  isFavorite: true,
  itemCount: 0,
  types: [],
  mainType: null,
  updatedAt: new Date(updatedAt),
});

const ITEMS = [
  item("beta", "notes", "2026-03-01"),
  item("Alpha", "prompts", "2026-01-01"),
  item("gamma", "snippets", "2026-02-01"),
  item("apple", "notes", "2026-04-01"),
];

const titles = (items: FavoriteItem[]) => items.map((i) => i.title);
const names = (collections: FavoriteCollection[]) => collections.map((c) => c.name);

describe("sortFavoriteItems", () => {
  it("sorts by date, newest first", () => {
    expect(titles(sortFavoriteItems(ITEMS, "date"))).toEqual(["apple", "beta", "gamma", "Alpha"]);
  });

  it("sorts by name, ignoring case", () => {
    expect(titles(sortFavoriteItems(ITEMS, "name"))).toEqual(["Alpha", "apple", "beta", "gamma"]);
  });

  it("sorts by system type order, then name", () => {
    expect(titles(sortFavoriteItems(ITEMS, "type"))).toEqual(["gamma", "Alpha", "apple", "beta"]);
  });

  it("puts unknown types last", () => {
    const items = [item("custom", "recipes", "2026-01-01"), item("link", "links", "2026-01-01")];
    expect(titles(sortFavoriteItems(items, "type"))).toEqual(["link", "custom"]);
  });

  it("doesn't change the original array", () => {
    const before = titles(ITEMS);
    sortFavoriteItems(ITEMS, "name");
    expect(titles(ITEMS)).toEqual(before);
  });
});

describe("sortFavoriteCollections", () => {
  const COLLECTIONS = [
    collection("Untitled", "2026-05-01"),
    collection("react", "2026-01-01"),
    collection("AI Prompts", "2026-03-01"),
    collection("Docs", "2026-02-01"),
  ];

  it("sorts by date, newest first", () => {
    expect(names(sortFavoriteCollections(COLLECTIONS, "date"))).toEqual([
      "Untitled",
      "AI Prompts",
      "Docs",
      "react",
    ]);
  });

  it("sorts by name, ignoring case", () => {
    expect(names(sortFavoriteCollections(COLLECTIONS, "name"))).toEqual([
      "AI Prompts",
      "Docs",
      "react",
      "Untitled",
    ]);
  });
});
