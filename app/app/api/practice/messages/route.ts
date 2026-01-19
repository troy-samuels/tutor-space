import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { data: student } = await adminClient
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data: session } = await adminClient
      .from("student_practice_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("student_id", student.id)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { data: messages } = await adminClient
      .from("student_practice_messages")
      .select("id, role, content, corrections, vocabulary_used, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(50);

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("[Practice Messages] Error:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}
