import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { parseEditorPreferences } from "@/lib/editor-preferences";
import type { EditorPreferences } from "@/lib/validations/editor-preferences";
import type { ProfileUser } from "@/types/profile";

const BCRYPT_ROUNDS = 12;

export async function getProfileUser(userId: string): Promise<ProfileUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true, createdAt: true, password: true },
  });
  if (!user) return null;

  const { password, ...profile } = user;
  return { ...profile, hasPassword: password !== null };
}

// Defaults for users who haven't changed a setting, or who no longer exist
export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });
  return parseEditorPreferences(user?.editorPreferences);
}

// Returns false when the user no longer exists
export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences
): Promise<boolean> {
  const { count } = await prisma.user.updateMany({
    where: { id: userId },
    data: { editorPreferences: preferences },
  });
  return count > 0;
}

export interface NewUser {
  id: string;
  name: string | null;
  email: string | null;
}

// Returns null when a user with the email already exists
export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<NewUser | null> {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) return null;

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    return await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true },
    });
  } catch (error) {
    // A concurrent request can create the same email between the check and the insert
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}
