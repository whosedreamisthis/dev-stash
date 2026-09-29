import { describe, expect, it } from "vitest";
import { getSectionLinks, SECTION_LINKS } from "@/lib/homepage-content";

describe("getSectionLinks", () => {
  it("keeps same-page anchors on the homepage", () => {
    expect(getSectionLinks("home")).toEqual(SECTION_LINKS);
  });

  it("points the anchors at the homepage from the auth pages", () => {
    for (const page of ["sign-in", "register"] as const) {
      expect(getSectionLinks(page)).toEqual([
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/#pricing" },
      ]);
    }
  });

  it("doesn't change the shared section links", () => {
    getSectionLinks("sign-in");
    expect(SECTION_LINKS[0].href).toBe("#features");
  });
});
