import { describe, expect, it } from "vitest";
import { getSafeHttpUrl } from "@/lib/url";

describe("getSafeHttpUrl", () => {
  it("returns http and https URLs", () => {
    expect(getSafeHttpUrl("https://nextjs.org/docs")).toBe("https://nextjs.org/docs");
    expect(getSafeHttpUrl(" http://localhost:3000 ")).toBe("http://localhost:3000/");
  });

  it("rejects other protocols", () => {
    expect(getSafeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeHttpUrl("data:text/html,hi")).toBeNull();
  });

  it("rejects empty and relative values", () => {
    expect(getSafeHttpUrl(null)).toBeNull();
    expect(getSafeHttpUrl("")).toBeNull();
    expect(getSafeHttpUrl("/items/snippets")).toBeNull();
  });
});
