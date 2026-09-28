import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getItemFile } from "@/lib/db/items";
import { getContentDisposition } from "@/lib/upload-constraints";
import { getSignedFileUrl } from "@/lib/uploadthing";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// Streams the item's file from UploadThing through the app's own origin, so
// downloads work without CORS and only the item's owner can fetch it
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/items/[id]/file">
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return errorResponse("You must be signed in.", 401);

  const { id } = await params;

  try {
    const file = await getItemFile(userId, id);
    if (!file) return errorResponse("File not found", 404);

    const upstream = await fetch(await getSignedFileUrl(file.key));
    if (!upstream.ok || !upstream.body) {
      console.error("Fetching uploaded file failed:", upstream.status);
      return errorResponse("The file couldn't be loaded. Please try again.", 502);
    }

    const headers = new Headers({
      "Content-Type": file.mimeType,
      // Downloaded rather than opened in the app's origin; <img> previews still
      // render, but an SVG opened directly can't run scripts
      "Content-Disposition": getContentDisposition(file.name),
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=300",
    });
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);

    return new Response(upstream.body, { headers });
  } catch (error) {
    console.error("Downloading file failed:", error);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
}
