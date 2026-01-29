import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/api/error-responses";

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const respondError = (message: string, status: number, code: string) =>
    errorResponse(message, { status, code, extra: { requestId } });

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return respondError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return respondError("Missing sessionId", 400, "INVALID_REQUEST");
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return respondError("Service unavailable", 503, "SERVICE_UNAVAILABLE");
    }

    const { data: student } = await adminClient
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return respondError("Unauthorized", 403, "UNAUTHORIZED");
    }

    const { data: session } = await adminClient
      .from("student_practice_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("student_id", student.id)
      .maybeSingle();

    if (!session) {
      return respondError("Session not found", 404, "SESSION_NOT_FOUND");
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
    return respondError("Failed to load messages", 500, "INTERNAL_ERROR");
  }
}
