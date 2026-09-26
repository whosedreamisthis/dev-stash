import { NextResponse, type NextRequest } from "next/server";
import { verifyEmailToken, type VerifyEmailResult } from "@/lib/verification";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  let result: VerifyEmailResult = "invalid";
  if (token) {
    try {
      result = await verifyEmailToken(token);
    } catch (error) {
      console.error("Email verification failed:", error);
    }
  }

  const signInUrl = new URL("/sign-in", request.nextUrl.origin);
  signInUrl.searchParams.set("verify", result);
  return NextResponse.redirect(signInUrl);
}
