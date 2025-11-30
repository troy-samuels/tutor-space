import { NextResponse } from "next/server";
import { getImpersonationFromCookies } from "@/lib/admin/impersonation";

export async function GET() {
  try {
    const impersonation = await getImpersonationFromCookies();

    if (!impersonation) {
      return NextResponse.json({
        active: false,
      });
    }

    // Check if session has expired
    const now = Math.floor(Date.now() / 1000);
    if (impersonation.exp && impersonation.exp < now) {
      return NextResponse.json({
        active: false,
        expired: true,
      });
    }

    return NextResponse.json({
      active: true,
      adminEmail: impersonation.adminEmail,
      tutorId: impersonation.tutorId,
      tutorName: impersonation.tutorName,
      reason: impersonation.reason,
      startedAt: new Date(impersonation.iat * 1000).toISOString(),
      expiresAt: new Date(impersonation.exp * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Impersonation status error:", error);
    return NextResponse.json({
      active: false,
    });
  }
}
