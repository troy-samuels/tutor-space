import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/admin/session";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  const admin = await verifyAdminSession(sessionToken);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tutorId = searchParams.get("tutor_id");

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }

  if (tutorId) {
    // Get overrides for a specific tutor
    const { data: overrides, error } = await supabase
      .from("plan_overrides")
      .select(`
        *,
        created_by_admin:created_by (
          id,
          email,
          full_name
        )
      `)
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get plan history
    const { data: history } = await supabase
      .from("plan_change_history")
      .select("*")
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      overrides: overrides || [],
      history: history || [],
    });
  }

  // Get all active overrides
  const { data: overrides, error, count } = await supabase
    .from("plan_overrides")
    .select(`
      *,
      profiles:tutor_id (
        id,
        full_name,
        email,
        username
      ),
      created_by_admin:created_by (
        id,
        email,
        full_name
      )
    `, { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    overrides: overrides || [],
    total: count || 0,
  });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  const admin = await verifyAdminSession(sessionToken);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    tutorId,
    overrideType,
    planName,
    maxStudents,
    featuresEnabled,
    expiresAt,
    reason,
    notes,
  } = body;

  if (!tutorId || !overrideType) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }

  // Get current plan for history
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", tutorId)
    .single();

  // Create override
  const { data: override, error } = await supabase
    .from("plan_overrides")
    .insert({
      tutor_id: tutorId,
      override_type: overrideType,
      plan_name: planName || null,
      original_plan: profile?.plan || "professional",
      max_students: maxStudents || null,
      features_enabled: featuresEnabled || null,
      expires_at: expiresAt || null,
      reason,
      notes,
      created_by: admin.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating override:", error);
    return NextResponse.json(
      { error: "Failed to create override" },
      { status: 500 }
    );
  }

  // Log to history
  await supabase.from("plan_change_history").insert({
    tutor_id: tutorId,
    previous_plan: profile?.plan || "professional",
    new_plan: planName || profile?.plan,
    change_type: "admin_override",
    changed_by: admin.id,
    notes: `Override: ${overrideType}. Reason: ${reason || "Not specified"}`,
  });

  return NextResponse.json({ success: true, override });
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  const admin = await verifyAdminSession(sessionToken);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { overrideId, action } = body;

  if (!overrideId || !action) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }

  if (action === "deactivate") {
    const { error } = await supabase
      .from("plan_overrides")
      .update({ is_active: false })
      .eq("id", overrideId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to deactivate override" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
