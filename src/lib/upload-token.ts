import { createHmac, timingSafeEqual } from "node:crypto";
import type { UploadTypeSlug } from "@/lib/upload-constraints";

// Signed by the server after UploadThing confirms an upload and checked again
// when the item is created, so the file's key, name, size and type can't be
// swapped by the browser in between
export interface UploadedFile {
  typeSlug: UploadTypeSlug;
  key: string;
  name: string;
  size: number;
  mimeType: string;
}

interface UploadTokenPayload extends UploadedFile {
  userId: string;
  expiresAt: number;
}

// Long enough to fill in the rest of the form after uploading
const UPLOAD_TOKEN_TTL_MS = 60 * 60 * 1000;

function sign(data: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be set to sign upload tokens");
  return createHmac("sha256", `upload-token:${secret}`).update(data).digest("base64url");
}

export function createUploadToken(userId: string, file: UploadedFile): string {
  const payload: UploadTokenPayload = {
    ...file,
    userId,
    expiresAt: Date.now() + UPLOAD_TOKEN_TTL_MS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

// Returns null for tampered, expired or another user's tokens
export function verifyUploadToken(userId: string, token: string): UploadedFile | null {
  const [data, signature, ...rest] = token.split(".");
  if (!data || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  let payload: UploadTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (payload.userId !== userId || payload.expiresAt < Date.now()) return null;

  const { typeSlug, key, name, size, mimeType } = payload;
  return { typeSlug, key, name, size, mimeType };
}
