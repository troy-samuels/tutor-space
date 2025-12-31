import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type BookingIcsRecord = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  timezone: string | null;
  meeting_url: string | null;
  students: {
    full_name: string | null;
    email: string | null;
  } | null;
  services: {
    name: string | null;
  } | null;
  profiles:
    | {
        full_name: string | null;
        email: string | null;
      }
    | { full_name: string | null; email: string | null }[]
    | null;
};

function formatIcsDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function buildIcsEvent(params: {
  uid: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  organizerName?: string;
  organizerEmail?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  location?: string | null;
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TutorLingua//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(params.uid)}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(params.start)}`,
    `DTEND:${formatIcsDate(params.end)}`,
    `SUMMARY:${escapeIcsText(params.title)}`,
    `DESCRIPTION:${escapeIcsText(params.description)}`,
    "STATUS:CONFIRMED",
  ];

  if (params.location) {
    lines.push(`LOCATION:${escapeIcsText(params.location)}`);
  }

  if (params.organizerEmail) {
    const organizerName = params.organizerName
      ? `;CN=${escapeIcsText(params.organizerName)}`
      : "";
    lines.push(`ORGANIZER${organizerName}:MAILTO:${params.organizerEmail}`);
  }

  if (params.attendeeEmail) {
    const attendeeName = params.attendeeName
      ? `;CN=${escapeIcsText(params.attendeeName)}`
      : "";
    lines.push(`ATTENDEE${attendeeName}:MAILTO:${params.attendeeEmail}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("booking_id") ?? searchParams.get("bookingId");

  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data: bookingData, error } = await adminClient
    .from("bookings")
    .select(
      `
        id,
        scheduled_at,
        duration_minutes,
        timezone,
        meeting_url,
        students (
          full_name,
          email
        ),
        services (
          name
        ),
        profiles!bookings_tutor_id_fkey (
          full_name,
          email
        )
      `
    )
    .eq("id", bookingId)
    .single();

  const booking = (bookingData ?? null) as BookingIcsRecord | null;

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const startDate = new Date(booking.scheduled_at);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Invalid booking date" }, { status: 400 });
  }

  const durationMinutes = booking.duration_minutes ?? 60;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  const serviceName = booking.services?.name ?? "Lesson";
  const tutorProfile = Array.isArray(booking.profiles)
    ? booking.profiles[0] ?? null
    : booking.profiles;
  const tutorName = tutorProfile?.full_name ?? "Tutor";
  const tutorEmail = tutorProfile?.email ?? undefined;
  const studentName = booking.students?.full_name ?? "Student";
  const studentEmail = booking.students?.email ?? undefined;

  const descriptionLines = [
    `Tutor: ${tutorName}`,
    `Student: ${studentName}`,
    `Service: ${serviceName}`,
    booking.meeting_url ? `Meeting link: ${booking.meeting_url}` : "Meeting link: TBD",
    `Booking ID: ${booking.id}`,
    booking.timezone ? `Timezone: ${booking.timezone}` : null,
  ].filter(Boolean) as string[];

  const icsBody = buildIcsEvent({
    uid: `booking-${booking.id}@tutorlingua`,
    title: `${serviceName} with ${tutorName}`,
    description: descriptionLines.join("\n"),
    start: startDate,
    end: endDate,
    organizerName: tutorName,
    organizerEmail: tutorEmail,
    attendeeName: studentName,
    attendeeEmail: studentEmail,
    location: booking.meeting_url || null,
  });

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="tutorlingua-lesson-${booking.id}.ics"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
