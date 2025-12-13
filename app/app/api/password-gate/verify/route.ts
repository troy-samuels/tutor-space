import { NextRequest, NextResponse } from "next/server";
import {
  createGateSession,
  setGateSessionCookie,
  verifyGatePassword,
  isGateEnabled,
} from "@/lib/password-gate/session";

export async function POST(request: NextRequest) {
  try {
    // Check if gate is enabled
    if (!isGateEnabled()) {
      return NextResponse.json(
        { error: "Password gate is not enabled" },
        { status: 400 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Verify password
    if (!verifyGatePassword(password)) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    // Create session token
    const sessionToken = await createGateSession();

    // Set session cookie
    await setGateSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      redirect: "/",
    });
  } catch (error) {
    console.error("Password gate verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during verification" },
      { status: 500 }
    );
  }
}
