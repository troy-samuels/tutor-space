import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createExpressAccount } from "@/lib/services/connect";

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Verify authenticated user
    const authClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      );
    }

    const { tutorId } = await req.json();
    if (!tutorId) {
      return NextResponse.json({ error: "Missing tutorId" }, { status: 400 });
    }

    // SECURITY: Verify user owns the tutorId
    if (user.id !== tutorId) {
      return NextResponse.json(
        { error: "Forbidden. You can only create Connect accounts for your own profile." },
        { status: 403 }
      );
    }

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });
    }

    const accountId = await createExpressAccount(tutorId, supabase);
    return NextResponse.json({ accountId });
  } catch (error) {
    console.error("Connect account create failed", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}


