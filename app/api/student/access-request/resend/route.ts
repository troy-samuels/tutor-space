import { NextResponse } from "next/server";
import { resendAccessRequest } from "@/lib/actions/student-auth";

export async function POST(request: Request) {
  const { tutorId } = (await request.json()) as { tutorId?: string };

  if (!tutorId) {
    return NextResponse.json({ error: "Missing tutorId" }, { status: 400 });
  }

  const result = await resendAccessRequest(tutorId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
