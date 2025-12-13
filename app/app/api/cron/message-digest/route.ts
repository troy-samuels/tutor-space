import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sendUnreadMessagesDigestEmail } from "@/lib/emails/ops-emails";
import { recordSystemMetric, startDuration } from "@/lib/monitoring";

type ThreadRow = {
  id: string;
  tutor_id: string;
  student_id: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  students?:
    | { full_name: string | null; email: string | null }
    | { full_name: string | null; email: string | null }[];
  profiles?:
    | { full_name: string | null; email: string | null }
    | { full_name: string | null; email: string | null }[];
  tutor?:
    | { full_name: string | null; email: string | null }
    | { full_name: string | null; email: string | null }[];
};

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co").replace(/\/$/, "");

/**
 * Cron: send unread message digests (once daily)
 */
export async function GET(request: Request) {
  const endTimer = startDuration("cron:message-digest");
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const [tutorRes, studentRes] = await Promise.all([
      admin
        .from("conversation_threads")
        .select(
          `
          id,
          tutor_id,
          student_id,
          last_message_preview,
          last_message_at,
          tutor_unread,
          students(full_name, email),
          profiles!conversation_threads_tutor_id_fkey(full_name, email)
        `
        )
        .eq("tutor_unread", true),
      admin
        .from("conversation_threads")
        .select(
          `
          id,
          tutor_id,
          student_id,
          last_message_preview,
          last_message_at,
          student_unread,
          students(id, full_name, email),
          tutor:profiles!conversation_threads_tutor_id_fkey(full_name, email)
        `
        )
        .eq("student_unread", true),
    ]);

    const tutorMap = new Map<
      string,
      {
        email: string;
        name: string;
        items: Array<{
          otherPartyName: string;
          preview: string;
          lastMessageAt: string;
          threadUrl: string;
        }>;
      }
    >();

    (tutorRes.data as ThreadRow[] | null)?.forEach((row) => {
      const tutor = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const student = Array.isArray(row.students) ? row.students[0] : row.students;
      if (!tutor?.email || !row.last_message_at) return;

      const existing = tutorMap.get(row.tutor_id) || {
        email: tutor.email,
        name: tutor.full_name || "Tutor",
        items: [],
      };

      existing.items.push({
        otherPartyName: student?.full_name || "Student",
        preview: row.last_message_preview || "New message",
        lastMessageAt: row.last_message_at,
        threadUrl: `${APP_URL}/messages?thread=${row.id}`,
      });

      tutorMap.set(row.tutor_id, existing);
    });

    const studentMap = new Map<
      string,
      {
        email: string;
        name: string;
        items: Array<{
          otherPartyName: string;
          preview: string;
          lastMessageAt: string;
          threadUrl: string;
        }>;
      }
    >();

    (studentRes.data as ThreadRow[] | null)?.forEach((row) => {
      const student = Array.isArray(row.students) ? row.students[0] : row.students;
      const tutor = Array.isArray(row.tutor) ? row.tutor[0] : row.tutor;
      if (!student?.email || !row.last_message_at) return;

      const existing = studentMap.get(row.student_id) || {
        email: student.email,
        name: student.full_name || "Student",
        items: [],
      };

      existing.items.push({
        otherPartyName: tutor?.full_name || "Tutor",
        preview: row.last_message_preview || "New message",
        lastMessageAt: row.last_message_at,
        threadUrl: `${APP_URL}/student/messages?thread=${row.id}`,
      });

      studentMap.set(row.student_id, existing);
    });

    const todayKey = new Date().toISOString().slice(0, 10);
    let sent = 0;

    for (const [recipientId, payload] of tutorMap.entries()) {
      await sendUnreadMessagesDigestEmail({
        to: payload.email,
        recipientName: payload.name,
        role: "tutor",
        totalUnread: payload.items.length,
        items: payload.items.slice(0, 5),
        dashboardUrl: `${APP_URL}/messages`,
        idempotencyKey: `${recipientId}-tutor-${todayKey}`,
      });
      sent += 1;
    }

    for (const [recipientId, payload] of studentMap.entries()) {
      await sendUnreadMessagesDigestEmail({
        to: payload.email,
        recipientName: payload.name,
        role: "student",
        totalUnread: payload.items.length,
        items: payload.items.slice(0, 5),
        dashboardUrl: `${APP_URL}/student/messages`,
        idempotencyKey: `${recipientId}-student-${todayKey}`,
      });
      sent += 1;
    }

    const durationMs = endTimer();
    void recordSystemMetric({ metric: "cron:message-digest:sent", value: sent, sampleRate: 0.5 });
    void recordSystemMetric({
      metric: "cron:message-digest:duration_ms",
      value: durationMs ?? 0,
      sampleRate: 0.25,
    });

    return NextResponse.json({
      status: "ok",
      sent,
      tutors: tutorMap.size,
      students: studentMap.size,
    });
  } catch (error) {
    console.error("[cron:message-digest] unexpected error", error);
    endTimer();
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
