import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createCheckoutSession } from "@/lib/stripe";
import { enforceCheckoutRateLimit } from "@/lib/payments/checkout-rate-limit";

// Maximum allowed payment amount in dollars (prevents fraud/mistakes)
const MAX_PAYMENT_AMOUNT = 10000; // $10,000 max per transaction
const MIN_PAYMENT_AMOUNT = 1; // $1 minimum

export async function POST(req: NextRequest) {
  try {
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

    // RATE LIMITING: Per-user checkout session throttle (server-side, DB-backed)
    const rateLimitResult = await enforceCheckoutRateLimit({
      supabaseAdmin,
      userId: user.id,
      req,
      keyPrefix: "checkout:booking",
      limit: 5,
      windowSeconds: 60,
    });

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: rateLimitResult.error || "Too many requests" },
        { status: rateLimitResult.status ?? 429 }
      );
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
      .select(`
        id,
        status,
        payment_status,
        tutor_id,
        student_id,
        payment_amount,
        currency,
        services (
          id,
          name,
          price_amount,
          price_currency
        )
      `)
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

    const serviceRecord = Array.isArray(booking.services)
      ? booking.services[0]
      : booking.services;
    const expectedAmountCents =
      booking.payment_amount ??
      serviceRecord?.price_amount ??
      null;
    const expectedCurrency =
      (booking.currency ?? serviceRecord?.price_currency ?? normalizedCurrency).toLowerCase();

    if (!expectedAmountCents) {
      return NextResponse.json(
        { error: "Booking price not available. Please contact support at support@tutorlingua.co." },
        { status: 400 }
      );
    }

    const requestedAmountCents = Math.round(normalizedAmount * 100);
    if (
      requestedAmountCents !== expectedAmountCents ||
      normalizedCurrency !== expectedCurrency
    ) {
      return NextResponse.json(
        { error: "Checkout amount mismatch. Please refresh and try again." },
        { status: 400 }
      );
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

    // Check for restricted accounts (e.g., past due requirements, fraud flags)
    const { data: tutorStatus } = await supabaseAdmin
      .from("profiles")
      .select("stripe_onboarding_status")
      .eq("id", booking.tutor_id)
      .single();

    if (tutorStatus?.stripe_onboarding_status === "restricted") {
      return NextResponse.json(
        { error: "Tutor's payment account is currently restricted. Please contact the tutor or support at support@tutorlingua.co." },
        { status: 400 }
      );
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

    // Idempotency key prevents duplicate checkout sessions on rapid clicks
    const idempotencyKey = `booking:${bookingId}:${user.id}:${randomUUID()}`;

    // Create checkout session with destination charges
    const session = await createCheckoutSession({
      customerId: studentProfile.stripe_customer_id,
      priceAmount: expectedAmountCents,
      currency: expectedCurrency,
      successUrl: `${baseUrl}/book/success?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/book/cancelled?booking_id=${bookingId}`,
      metadata: {
        bookingId,
        studentId: studentProfile.id,
        tutorId: booking.tutor_id,
      },
      lineItems: [
        {
          name: serviceRecord?.name ?? serviceName,
          description:
            serviceDescription ||
            `Lesson with ${tutorProfile.full_name || "your tutor"}`,
          amount: expectedAmountCents,
          quantity: 1,
        },
      ],
      transferDestinationAccountId: tutorProfile.stripe_account_id,
      // 1% platform fee on booking payments
      applicationFeeCents: Math.round(expectedAmountCents * 0.01),
      idempotencyKey,
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
