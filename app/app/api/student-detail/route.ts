import { NextResponse } from "next/server";
import { getStudentDetailData } from "@/lib/data/student-detail";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
  }

  const detail = await getStudentDetailData(studentId);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
