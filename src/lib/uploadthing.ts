import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { auth } from "@/auth";
import { getUploadError, type UploadTypeSlug } from "@/lib/upload-constraints";
import { createUploadToken } from "@/lib/upload-token";
import { hasProAccess } from "@/lib/usage-limits";

export const UPLOAD_PRO_REQUIRED_ERROR = "File and image uploads require DevStash Pro.";

const f = createUploadthing();

// Reads UPLOADTHING_TOKEN from the environment
export const utapi = new UTApi();

// Short-lived, so the URL is only good for the proxy's own request
export async function getSignedFileUrl(key: string): Promise<string> {
  const { ufsUrl } = await utapi.generateSignedURL(key, { expiresIn: 60 });
  return ufsUrl;
}

// The item is already gone by the time this runs, so a failure only leaves an
// orphaned file behind; it's logged rather than reported to the user
export async function deleteUploadedFile(key: string): Promise<void> {
  try {
    const { success } = await utapi.deleteFiles(key);
    if (!success) console.error("Deleting uploaded file failed:", key);
  } catch (error) {
    console.error("Deleting uploaded file failed:", key, error);
  }
}

// UploadThing only accepts power-of-two limits, so the routes allow a little
// more and the middleware enforces the exact limits and extensions
export function uploadMiddleware(typeSlug: UploadTypeSlug) {
  return async ({ files }: { files: readonly { name: string; size: number; type: string }[] }) => {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new UploadThingError("You must be signed in to upload files.");
    // Checked before anything is stored, so free users' files never reach UploadThing
    if (!hasProAccess({ isPro: session.user.isPro ?? false })) {
      throw new UploadThingError(UPLOAD_PRO_REQUIRED_ERROR);
    }

    for (const file of files) {
      const error = getUploadError(typeSlug, file);
      if (error) throw new UploadThingError(error);
    }

    return { userId };
  };
}

type UploadCompleteResult = { uploadToken: string; error: null } | { uploadToken: null; error: string };

// The middleware only sees the sizes the browser reported, so the stored file
// is checked again and deleted if it breaks the limits
export function uploadComplete(typeSlug: UploadTypeSlug) {
  return async ({
    metadata,
    file,
  }: {
    metadata: { userId: string };
    file: { key: string; name: string; size: number; type: string };
  }): Promise<UploadCompleteResult> => {
    const error = getUploadError(typeSlug, file);
    if (error) {
      await deleteUploadedFile(file.key);
      return { uploadToken: null, error };
    }

    return {
      // Returned to the browser, which passes it back when creating the item
      uploadToken: createUploadToken(metadata.userId, {
        typeSlug,
        key: file.key,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
      }),
      error: null,
    };
  };
}

export const uploadRouter = {
  imageUploader: f(
    { image: { maxFileSize: "8MB", maxFileCount: 1 } },
    { awaitServerData: true }
  )
    .middleware(uploadMiddleware("images"))
    .onUploadComplete(uploadComplete("images")),

  // Any type is accepted here because browsers report inconsistent MIME types
  // for text files; the middleware checks the extension instead
  fileUploader: f(
    { blob: { maxFileSize: "16MB", maxFileCount: 1 } },
    { awaitServerData: true }
  )
    .middleware(uploadMiddleware("files"))
    .onUploadComplete(uploadComplete("files")),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
