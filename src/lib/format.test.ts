import { describe, expect, it } from "vitest";
import { DATE_WITH_YEAR_FORMATTER, formatItemCount } from "@/lib/format";

describe("formatItemCount", () => {
  it("uses the singular for one item", () => {
    expect(formatItemCount(1)).toBe("1 item");
  });

  it("uses the plural for zero and many items", () => {
    expect(formatItemCount(0)).toBe("0 items");
    expect(formatItemCount(21)).toBe("21 items");
  });
});

describe("DATE_WITH_YEAR_FORMATTER", () => {
  it("formats the UTC date with a short month and the year", () => {
    expect(DATE_WITH_YEAR_FORMATTER.format(new Date("2026-09-29T23:30:00Z"))).toBe(
      "Sep 29, 2026"
    );
  });
});
