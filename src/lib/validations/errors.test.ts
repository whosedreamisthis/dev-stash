import { describe, expect, it } from "vitest";
import { z } from "zod";
import { firstIssueMessage, toFirstFieldErrors } from "@/lib/validations/errors";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(3, "Name is too long"),
  email: z.email("Invalid email"),
});

function errorFor(input: unknown) {
  const parsed = schema.safeParse(input);
  if (parsed.success) throw new Error("Expected invalid input");
  return parsed.error;
}

describe("firstIssueMessage", () => {
  it("returns the first issue's message", () => {
    expect(firstIssueMessage(errorFor({ name: "", email: "x" }), "Invalid input")).toBe(
      "Name is required"
    );
  });

  it("returns the fallback when there are no issues", () => {
    expect(firstIssueMessage(new z.ZodError([]), "Invalid input")).toBe("Invalid input");
  });
});

describe("toFirstFieldErrors", () => {
  it("keeps the first message for each field with an error", () => {
    expect(toFirstFieldErrors<"name" | "email">(errorFor({ name: "", email: "x" }))).toEqual({
      name: "Name is required",
      email: "Invalid email",
    });
  });

  it("leaves out fields without errors", () => {
    expect(toFirstFieldErrors(errorFor({ name: "abcd", email: "a@b.co" }))).toEqual({
      name: "Name is too long",
    });
  });
});
