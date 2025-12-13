import { NextResponse } from "next/server";
import { syncStripeCustomer } from "@/lib/actions/stripe";

export async function POST() {
  try {
    const result = await syncStripeCustomer();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, customerId: result.customerId });
  } catch (error) {
    console.error("Error syncing Stripe customer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

