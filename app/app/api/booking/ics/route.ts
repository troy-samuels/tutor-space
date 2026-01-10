import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { buildBookingCalendarDetails } from "@/lib/calendar/booking-calendar-details";

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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const calendarDetails = await buildBookingCalendarDetails({
    client: adminClient,
    bookingId,
    baseUrl,
  });

  if (!calendarDetails) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const startDate = new Date(calendarDetails.start);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Invalid booking date" }, { status: 400 });
  }

  const icsBody = buildIcsEvent({
    uid: `booking-${calendarDetails.bookingId}@tutorlingua`,
    title: calendarDetails.title,
    description: calendarDetails.description,
    start: startDate,
    end: new Date(calendarDetails.end),
    organizerName: calendarDetails.tutorName,
    organizerEmail: calendarDetails.tutorEmail ?? undefined,
    attendeeName: calendarDetails.studentName,
    attendeeEmail: calendarDetails.studentEmail ?? undefined,
    location: calendarDetails.location ?? null,
  });

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="tutorlingua-lesson-${calendarDetails.bookingId}.ics"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
