import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/items/[id]">
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "You must be signed in." },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    // Scoped to the session user, so another user's item is reported as missing
    const item = await getItemDetail(userId, id);
    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Loading item failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
