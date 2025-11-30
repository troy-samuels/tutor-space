import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { refreshAccountStatus } from "@/lib/services/connect";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });
    }
    const { tutorId, accountId } = await req.json();
    if (!tutorId || !accountId) {
      return NextResponse.json({ error: "Missing tutorId or accountId" }, { status: 400 });
    }
    await refreshAccountStatus(tutorId, accountId, supabase);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Connect status refresh failed", error);
    return NextResponse.json({ error: "Failed to refresh status" }, { status: 500 });
  }
}


