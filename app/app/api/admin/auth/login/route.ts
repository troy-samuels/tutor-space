import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAdminUserByEmail,
  updateAdminLastLogin,
  logAdminAction,
  getClientIP,
} from "@/lib/admin/auth";
import { createAdminSession, setAdminSessionCookie } from "@/lib/admin/session";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Authenticate via Supabase Auth
    const supabase = await createClient();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 2. Verify user exists in admin_users table and is active
    const adminUser = await getAdminUserByEmail(email);

    if (!adminUser) {
      // Sign out from Supabase since they're not an admin
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "You are not authorized to access the admin dashboard" },
        { status: 403 }
      );
    }

    // 3. Update last login timestamp
    await updateAdminLastLogin(adminUser.id);

    // 4. Log the login action
    await logAdminAction(adminUser.id, "login", {
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // 5. Create admin session token
    const sessionToken = await createAdminSession({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      full_name: adminUser.full_name,
    });

    // 6. Set session cookie
    await setAdminSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      redirect: "/admin/dashboard",
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.full_name,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
