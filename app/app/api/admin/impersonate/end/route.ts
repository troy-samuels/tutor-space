import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { logAdminAction, getClientIP } from "@/lib/admin/auth";
import {
  getImpersonationFromCookies,
  clearImpersonationCookie,
} from "@/lib/admin/impersonation";

export async function POST(request: NextRequest) {
  try {
    const impersonation = await getImpersonationFromCookies();

    if (!impersonation) {
      return NextResponse.json({
        success: true,
        message: "No active impersonation session",
      });
    }

    const supabase = createServiceRoleClient();
    if (supabase) {
      // Update the session record to mark as ended
      await supabase
        .from("impersonation_sessions")
        .update({
          ended_at: new Date().toISOString(),
          is_active: false,
        })
        .eq("id", impersonation.sessionId);

      // Log the action
      await logAdminAction(impersonation.adminId, "impersonate_end", {
        targetType: "tutor",
        targetId: impersonation.tutorId,
        metadata: {
          sessionId: impersonation.sessionId,
          duration: Math.floor(Date.now() / 1000) - impersonation.iat,
        },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get("user-agent") || undefined,
      });
    }

    // Clear the impersonation cookie
    await clearImpersonationCookie();

    return NextResponse.json({
      success: true,
      redirect: `/admin/tutors/${impersonation.tutorId}`,
    });
  } catch (error) {
    console.error("Impersonation end error:", error);

    // Always try to clear the cookie even if there's an error
    await clearImpersonationCookie();

    return NextResponse.json({
      success: true,
      redirect: "/admin/tutors",
    });
  }
}
