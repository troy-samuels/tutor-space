import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/admin/session";
import { isTableMissing } from "@/lib/utils/supabase-errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  const admin = await verifyAdminSession(sessionToken);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }

  // Get student details
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select(`
      *,
      profiles:tutor_id (
        id,
        full_name,
        email,
        username,
        avatar_url
      )
    `)
    .eq("id", id)
    .single();

  if (studentError || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Get student's bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      status,
      payment_status,
      payment_amount,
      currency,
      services (name)
    `)
    .eq("student_id", id)
    .order("scheduled_at", { ascending: false })
    .limit(20);

  // Get student's package purchases
  const { data: packages } = await supabase
    .from("session_package_purchases")
    .select(`
      id,
      remaining_minutes,
      expires_at,
      status,
      created_at,
      session_package_templates (name, session_count, total_minutes)
    `)
    .eq("student_id", id)
    .order("created_at", { ascending: false });

  // Get message count
  const { count: messageCount } = await supabase
    .from("conversation_messages")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", student.user_id || "none");

  // Get tutor connections for this student
  const { data: connections, error: connectionsError } = await supabase
    .from("student_tutor_connections")
    .select(`
      id,
      status,
      created_at,
      profiles:tutor_id (
        id,
        full_name,
        email,
        username
      )
    `)
    .eq("student_user_id", student.user_id || "none");

  if (connectionsError && !isTableMissing(connectionsError, "student_tutor_connections")) {
    console.error("Failed to load student connections:", connectionsError);
  }

  // Calculate booking stats
  const completedBookings = bookings?.filter((b) => b.status === "completed")?.length || 0;
  const upcomingBookings = bookings?.filter(
    (b) => b.status !== "cancelled" && new Date(b.scheduled_at) > new Date()
  )?.length || 0;
  const totalSpent = bookings
    ?.filter((b) => b.payment_status === "paid")
    ?.reduce((sum, b) => sum + (b.payment_amount || 0), 0) || 0;

  return NextResponse.json({
    student: {
      ...student,
      stats: {
        completed_bookings: completedBookings,
        upcoming_bookings: upcomingBookings,
        total_spent_cents: totalSpent,
        message_count: messageCount || 0,
      },
    },
    bookings: bookings || [],
    packages: packages || [],
    connections: connections || [],
  });
}
