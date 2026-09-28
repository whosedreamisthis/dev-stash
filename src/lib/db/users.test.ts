import { describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { createUser } from "@/lib/db/users";

vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));

vi.mock("bcryptjs", () => ({ default: { hash: vi.fn() } }));

const findUnique = vi.mocked(prisma.user.findUnique);
const create = vi.mocked(prisma.user.create);
const hash = vi.mocked(bcrypt.hash);

const NEW_USER = { id: "user-1", name: "Ada", email: "ada@example.com" };

describe("createUser", () => {
  it("hashes the password and creates the user", async () => {
    findUnique.mockResolvedValue(null);
    hash.mockResolvedValue("hashed" as never);
    create.mockResolvedValue(NEW_USER as never);

    await expect(createUser("Ada", "ada@example.com", "secret123")).resolves.toEqual(NEW_USER);
    expect(hash).toHaveBeenCalledWith("secret123", 12);
    expect(create).toHaveBeenCalledWith({
      data: { name: "Ada", email: "ada@example.com", password: "hashed" },
      select: { id: true, name: true, email: true },
    });
  });

  it("returns null without creating a user when the email is taken", async () => {
    findUnique.mockResolvedValue({ id: "existing" } as never);

    await expect(createUser("Ada", "ada@example.com", "secret123")).resolves.toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("returns null when a concurrent request takes the email first", async () => {
    findUnique.mockResolvedValue(null);
    hash.mockResolvedValue("hashed" as never);
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "7",
      })
    );

    await expect(createUser("Ada", "ada@example.com", "secret123")).resolves.toBeNull();
  });

  it("rethrows other database errors", async () => {
    findUnique.mockResolvedValue(null);
    hash.mockResolvedValue("hashed" as never);
    create.mockRejectedValue(new Error("connection lost"));

    await expect(createUser("Ada", "ada@example.com", "secret123")).rejects.toThrow(
      "connection lost"
    );
  });
});
