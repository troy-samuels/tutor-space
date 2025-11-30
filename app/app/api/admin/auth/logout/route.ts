import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminSession, logAdminAction, getClientIP } from "@/lib/admin/auth";
import { clearAdminSessionCookie } from "@/lib/admin/session";

export async function POST(request: NextRequest) {
  try {
    // Get current admin session before clearing
    const adminUser = await verifyAdminSession();

    // Log logout if we have a valid session
    if (adminUser) {
      await logAdminAction(adminUser.id, "logout", {
        ipAddress: getClientIP(request),
        userAgent: request.headers.get("user-agent") || undefined,
      });
    }

    // Clear admin session cookie
    await clearAdminSessionCookie();

    // Also sign out from Supabase
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      redirect: "/admin/login",
    });
  } catch (error) {
    console.error("Admin logout error:", error);

    // Even if there's an error, try to clear the cookie
    await clearAdminSessionCookie();

    return NextResponse.json({
      success: true,
      redirect: "/admin/login",
    });
  }
}
