import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitMessage,
  getRetryAfterSeconds,
} from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations/auth";
import { isEmailVerificationEnabled, sendVerificationLink } from "@/lib/verification";

function emailTakenResponse() {
  return NextResponse.json(
    { success: false, error: "A user with this email already exists" },
    { status: 409 },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    // Limits scripted email enumeration and mass sign-ups from one address
    const ip = getClientIp(request.headers);
    if (ip) {
      const { success, reset } = await checkRateLimit("register", ip);
      if (!success) {
        return NextResponse.json(
          { success: false, error: getRateLimitMessage(reset) },
          { status: 429, headers: { "Retry-After": String(getRetryAfterSeconds(reset)) } },
        );
      }
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) return emailTakenResponse();

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true },
    });

    const verificationRequired = isEmailVerificationEnabled();

    // The account stays created if the email fails; the user can request a new link
    const emailSent = verificationRequired
      ? await sendVerificationLink(email).catch((error: unknown) => {
          console.error("Sending verification email failed:", error);
          return false;
        })
      : false;

    return NextResponse.json(
      { success: true, data: { ...user, verificationRequired, emailSent } },
      { status: 201 },
    );
  } catch (error) {
    // A concurrent request can create the same email between the check and the insert
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return emailTakenResponse();
    }

    console.error("Registration failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
