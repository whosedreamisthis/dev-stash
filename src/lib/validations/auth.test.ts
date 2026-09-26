import { describe, expect, it } from "vitest";
import { registerSchema, signInSchema } from "@/lib/validations/auth";

describe("signInSchema", () => {
  it("trims and lowercases the email", () => {
    const result = signInSchema.parse({ email: "  Dev@Example.COM ", password: "x" });
    expect(result.email).toBe("dev@example.com");
  });

  it("rejects an invalid email", () => {
    const result = signInSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "Dev",
    email: "dev@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts valid input", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("reports mismatched passwords on confirmPassword", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "different1" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });
});
