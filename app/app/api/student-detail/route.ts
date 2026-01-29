import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStudentDetailData } from "@/lib/data/student-detail";
import { badRequest, notFound, unauthorized } from "@/lib/api/error-responses";

const studentIdSchema = z.string().uuid();

export async function GET(req: Request) {
  const requestId = randomUUID();
  const url = new URL(req.url);
  const rawStudentId = url.searchParams.get("studentId");

  if (!rawStudentId) {
    return badRequest("Missing studentId", { extra: { requestId } });
  }

  const parsedStudentId = studentIdSchema.safeParse(rawStudentId);
  if (!parsedStudentId.success) {
    return badRequest("Invalid studentId", {
      extra: { requestId },
      details: { issues: parsedStudentId.error.issues },
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized("Unauthorized", { extra: { requestId } });
  }

  const detail = await getStudentDetailData(parsedStudentId.data, {
    supabase,
    userId: user.id,
  });
  if (!detail) {
    return notFound("Not found", { extra: { requestId } });
  }

  return NextResponse.json(detail);
}
