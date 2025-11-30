import { NextRequest, NextResponse } from "next/server";
import { createDashboardLoginLink } from "@/lib/services/connect";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accountId } = body ?? {};
    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
    }
    const url = await createDashboardLoginLink(accountId);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Connect login link failed", error);
    return NextResponse.json({ error: "Failed to create login link" }, { status: 500 });
  }
}


