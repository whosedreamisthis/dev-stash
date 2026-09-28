import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCollectionOptions } from "@/lib/db/collections";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "You must be signed in." },
      { status: 401 }
    );
  }

  try {
    const collections = await getCollectionOptions(userId);
    return NextResponse.json({ success: true, data: collections });
  } catch (error) {
    console.error("Loading collections failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
