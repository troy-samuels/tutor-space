import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createCheckoutSession } from "@/lib/stripe";
import { RateLimiters } from "@/lib/middleware/rate-limit";

// Maximum allowed payment amount in dollars (prevents fraud/mistakes)
const MAX_PAYMENT_AMOUNT = 10000; // $10,000 max per transaction
const MIN_PAYMENT_AMOUNT = 1; // $1 minimum

export async function POST(req: NextRequest) {
  try {
    // RATE LIMITING: Prevent checkout session exhaustion attacks
    const rateLimitResult = await RateLimiters.api(req);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error || "Too many requests" },
        { status: 429 }
      );
    }

    const supabaseAdmin = createServiceRoleClient();
    const supabase = await createClient();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const {
      bookingId,
      amount,
      currency = "usd",
      serviceName,
      serviceDescription,
    } = body;

    // PAYMENT AMOUNT VALIDATION: Prevent arbitrary charge amounts
    // Validate amount before any conversion to prevent NaN/Infinity issues
    if (typeof amount !== "number" && typeof amount !== "string") {
      return NextResponse.json({ error: "Invalid amount type" }, { status: 400 });
    }

    const normalizedAmount = Number(amount);

    // Comprehensive amount validation
    if (
      !Number.isFinite(normalizedAmount) ||
      normalizedAmount < MIN_PAYMENT_AMOUNT ||
      normalizedAmount > MAX_PAYMENT_AMOUNT
    ) {
      return NextResponse.json(
        {
          error: `Amount must be between $${MIN_PAYMENT_AMOUNT} and $${MAX_PAYMENT_AMOUNT.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    // Validate currency is a known ISO 4217 code (basic check)
    const validCurrencies = ["usd", "eur", "gbp", "cad", "aud", "jpy", "mxn", "brl"];
    const normalizedCurrency = currency.toLowerCase();
    if (!validCurrencies.includes(normalizedCurrency)) {
      return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
    }

    if (!bookingId || !serviceName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify booking and ownership
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, status, payment_status, tutor_id, student_id")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Fetch student record to validate auth and look up Stripe customer
    const { data: studentRecord } = await supabaseAdmin
      .from("students")
      .select("id, user_id")
      .eq("id", booking.student_id)
      .single();

    const isTutor = booking.tutor_id === user.id;
    const isStudent = studentRecord?.user_id === user.id;

    if (!isTutor && !isStudent) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json({ error: "Booking already paid" }, { status: 400 });
    }

    // Get tutor's Stripe Connect account
    const { data: tutorProfile, error: tutorError } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id, stripe_charges_enabled, full_name")
      .eq("id", booking.tutor_id)
      .single();

    if (tutorError || !tutorProfile) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    if (!tutorProfile.stripe_account_id || !tutorProfile.stripe_charges_enabled) {
      return NextResponse.json({ error: "Tutor cannot accept Stripe payments" }, { status: 400 });
    }

    // Get student's Stripe customer ID via their auth user profile
    const studentUserId = studentRecord?.user_id;
    const { data: studentProfile, error: studentError } = studentUserId
      ? await supabaseAdmin
          .from("profiles")
          .select("id, stripe_customer_id, email, full_name")
          .eq("id", studentUserId)
          .single()
      : { data: null, error: null };

    if (studentError || !studentProfile) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (!studentProfile.stripe_customer_id) {
      return NextResponse.json(
        { error: "Student needs to be set up for payments" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create checkout session with destination charges
    const session = await createCheckoutSession({
      customerId: studentProfile.stripe_customer_id,
      priceAmount: Math.round(normalizedAmount * 100), // Convert to cents
      currency: normalizedCurrency,
      successUrl: `${baseUrl}/book/success?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/book/cancelled?booking_id=${bookingId}`,
      metadata: {
        bookingId,
        studentId: studentProfile.id,
        tutorId: booking.tutor_id,
      },
      lineItems: [
        {
          name: serviceName,
          description:
            serviceDescription ||
            `Lesson with ${tutorProfile.full_name || "your tutor"}`,
          amount: Math.round(normalizedAmount * 100),
          quantity: 1,
        },
      ],
      transferDestinationAccountId: tutorProfile.stripe_account_id,
      // No platform fee for now as per user requirements
      applicationFeeCents: undefined,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating booking checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
