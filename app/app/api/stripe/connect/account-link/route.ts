import { NextRequest, NextResponse } from "next/server";
import { createAccountLink } from "@/lib/services/connect";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accountId } = body ?? {};
    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
    }
    const refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/payments`;
    const returnUrl = process.env.STRIPE_CONNECT_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/payments`;
    const url = await createAccountLink(accountId, refreshUrl, returnUrl);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Connect account link failed", error);
    return NextResponse.json({ error: "Failed to create account link" }, { status: 500 });
  }
}


