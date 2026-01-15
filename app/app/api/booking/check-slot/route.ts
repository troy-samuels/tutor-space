import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api/error-responses";
import { checkSlotAvailabilityForTutor } from "@/lib/actions/bookings";

export async function POST(request: Request) {
  const { tutorId, startISO, durationMinutes } = (await request.json()) as {
    tutorId?: string;
    startISO?: string;
    durationMinutes?: number;
  };

  if (!tutorId || !startISO || !durationMinutes) {
    return badRequest("Missing parameters");
  }

  const result = await checkSlotAvailabilityForTutor({
    tutorId,
    startISO,
    durationMinutes,
  });

  if ("error" in result) {
    return badRequest(result.error);
  }

  return NextResponse.json({ available: result.available });
}
