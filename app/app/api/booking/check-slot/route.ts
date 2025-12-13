import { NextResponse } from "next/server";
import { checkSlotAvailabilityForTutor } from "@/lib/actions/bookings";

export async function POST(request: Request) {
  const { tutorId, startISO, durationMinutes } = (await request.json()) as {
    tutorId?: string;
    startISO?: string;
    durationMinutes?: number;
  };

  if (!tutorId || !startISO || !durationMinutes) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const result = await checkSlotAvailabilityForTutor({
    tutorId,
    startISO,
    durationMinutes,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ available: result.available });
}

