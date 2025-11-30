import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin/auth";

export async function GET() {
  try {
    const adminUser = await verifyAdminSession();

    if (!adminUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.full_name,
        role: adminUser.role,
        lastLoginAt: adminUser.last_login_at,
        createdAt: adminUser.created_at,
      },
    });
  } catch (error) {
    console.error("Admin auth check error:", error);
    return NextResponse.json(
      { error: "Authentication check failed" },
      { status: 500 }
    );
  }
}
