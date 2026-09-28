import { describe, expect, it, vi } from "vitest";
import {
  getPageHref,
  getPageLinks,
  getPageRange,
  getTotalPages,
  paginate,
  parsePage,
} from "@/lib/pagination";

describe("parsePage", () => {
  it("reads a positive whole page number", () => {
    expect(parsePage("3")).toBe(3);
  });

  it("falls back to page 1 for missing or invalid values", () => {
    for (const value of [undefined, "", "0", "-2", "1.5", "abc", "99999999999999999999", ["2"]]) {
      expect(parsePage(value)).toBe(1);
    }
  });
});

describe("getTotalPages", () => {
  it("rounds up and is at least 1", () => {
    expect(getTotalPages(0, 21)).toBe(1);
    expect(getTotalPages(21, 21)).toBe(1);
    expect(getTotalPages(22, 21)).toBe(2);
  });
});

describe("getPageRange", () => {
  it("skips the earlier pages", () => {
    expect(getPageRange(1, 21)).toEqual({ skip: 0, take: 21 });
    expect(getPageRange(3, 21)).toEqual({ skip: 42, take: 21 });
  });
});

describe("getPageLinks", () => {
  it("lists every page when there are few", () => {
    expect(getPageLinks(1, 1)).toEqual([1]);
    expect(getPageLinks(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("puts gaps around the current page's neighbours", () => {
    expect(getPageLinks(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
    expect(getPageLinks(1, 10)).toEqual([1, 2, "ellipsis", 10]);
    expect(getPageLinks(10, 10)).toEqual([1, "ellipsis", 9, 10]);
  });

  it("shows a single skipped page instead of a gap", () => {
    expect(getPageLinks(4, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10]);
  });
});

describe("getPageHref", () => {
  it("leaves the page off for page 1", () => {
    expect(getPageHref("/collections", 1)).toBe("/collections");
    expect(getPageHref("/collections", 2)).toBe("/collections?page=2");
  });
});

describe("paginate", () => {
  it("counts and fetches the requested page", async () => {
    const fetchPage = vi.fn().mockResolvedValue(["a"]);
    await expect(paginate(2, 21, async () => 30, fetchPage)).resolves.toEqual({
      items: ["a"],
      total: 30,
      page: 2,
      totalPages: 2,
    });
    expect(fetchPage).toHaveBeenCalledOnce();
    expect(fetchPage).toHaveBeenCalledWith({ skip: 21, take: 21 });
  });

  it("fetches the last page instead when the page is past the end", async () => {
    const fetchPage = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce(["z"]);
    await expect(paginate(9, 21, async () => 30, fetchPage)).resolves.toEqual({
      items: ["z"],
      total: 30,
      page: 2,
      totalPages: 2,
    });
    expect(fetchPage).toHaveBeenLastCalledWith({ skip: 21, take: 21 });
  });

  it("returns page 1 with no items when there's nothing", async () => {
    const fetchPage = vi.fn().mockResolvedValue([]);
    await expect(paginate(1, 21, async () => 0, fetchPage)).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      totalPages: 1,
    });
  });
});
