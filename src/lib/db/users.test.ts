import { describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  createUser,
  getEditorPreferences,
  updateEditorPreferences,
} from "@/lib/db/users";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";

vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn() } },
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

describe("getEditorPreferences", () => {
  it("reads the user's stored preferences over the defaults", async () => {
    findUnique.mockResolvedValue({ editorPreferences: { fontSize: 16, theme: "monokai" } } as never);
    await expect(getEditorPreferences("user-1")).resolves.toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 16,
      theme: "monokai",
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { editorPreferences: true },
    });
  });

  it("returns the defaults when nothing is stored or the user is gone", async () => {
    findUnique.mockResolvedValue({ editorPreferences: null } as never);
    await expect(getEditorPreferences("user-1")).resolves.toEqual(DEFAULT_EDITOR_PREFERENCES);
    findUnique.mockResolvedValue(null);
    await expect(getEditorPreferences("user-1")).resolves.toEqual(DEFAULT_EDITOR_PREFERENCES);
  });
});

describe("updateEditorPreferences", () => {
  const updateMany = vi.mocked(prisma.user.updateMany);

  it("saves the preferences on the user and reports whether the user exists", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    await expect(updateEditorPreferences("user-1", DEFAULT_EDITOR_PREFERENCES)).resolves.toBe(true);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { editorPreferences: DEFAULT_EDITOR_PREFERENCES },
    });

    updateMany.mockResolvedValue({ count: 0 });
    await expect(updateEditorPreferences("gone", DEFAULT_EDITOR_PREFERENCES)).resolves.toBe(false);
  });
});
