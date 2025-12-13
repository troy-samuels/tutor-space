import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  bookingId: z.string().min(1),
  notes: z.string().optional().nullable(),
});

function formatLessonHeader(input: {
  serviceName?: string | null;
  scheduledAt?: string | null;
}) {
  const when = input.scheduledAt ? new Date(input.scheduledAt) : new Date();
  const date = when.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const time = when.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const service = input.serviceName?.trim() ? input.serviceName.trim() : "Lesson";
  return `${service} — ${date} ${time}`;
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    const parsedJson = raw ? JSON.parse(raw) : {};
    const parsed = bodySchema.safeParse(parsedJson);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const bookingId = parsed.data.bookingId;
    const notes = (parsed.data.notes ?? "").trim();
    if (!notes) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        tutor_id,
        student_id,
        scheduled_at,
        services (
          name
        )
      `
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.tutor_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const servicesRelation = (booking as any).services as { name?: string | null }[] | { name?: string | null } | null | undefined;
    const serviceName = Array.isArray(servicesRelation)
      ? servicesRelation[0]?.name ?? null
      : servicesRelation?.name ?? null;

    const header = formatLessonHeader({
      serviceName,
      scheduledAt: booking.scheduled_at,
    });

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, tutor_id, notes")
      .eq("id", booking.student_id)
      .eq("tutor_id", user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const block = `---\n${header}\n${notes}\n`;
    const current = student.notes ?? "";

    if (current.includes(block)) {
      return NextResponse.json({ ok: true, alreadySaved: true });
    }

    const nextNotes = current.trim()
      ? `${current.trim()}\n\n${block}`
      : block;

    const { error: updateError } = await supabase
      .from("students")
      .update({ notes: nextNotes, updated_at: new Date().toISOString() })
      .eq("id", student.id)
      .eq("tutor_id", user.id);

    if (updateError) {
      console.error("[Tutor Notes] Failed to save:", updateError);
      return NextResponse.json({ error: "Failed to save notes" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Tutor Notes] Error:", error);
    return NextResponse.json({ error: "Failed to save notes" }, { status: 500 });
  }
}
