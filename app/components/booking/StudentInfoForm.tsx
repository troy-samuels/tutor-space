"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useRouter } from "next/navigation";
import type { BookableSlot } from "@/lib/utils/slots";
import { createBookingAndCheckout } from "@/lib/actions/bookings";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { detectUserTimezone } from "@/lib/utils/timezones";
import { formatCurrency } from "@/lib/utils";
import { SubscriptionCreditSelector, type SubscriptionCredit } from "./SubscriptionCreditSelector";
import { FormStatusAlert } from "@/components/forms/form-status-alert";
import { formatBookingError } from "@/lib/utils/booking-errors";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: number;
  price_currency: string;
}

interface Tutor {
  id: string;
  fullName: string;
  username: string;
  email: string;
  timezone: string;
}

interface StudentInfoFormProps {
  tutor: Tutor;
  service: Service;
  selectedSlot: BookableSlot;
  onBack: () => void;
  activeSubscription?: SubscriptionCredit | null;
  onSubmitStart?: () => void;
  onSubmitSuccess?: (result: { bookingId: string; checkoutUrl?: string | null }) => void;
  onSubmitError?: (message: string) => void;
}

export default function StudentInfoForm({
  tutor,
  service,
  selectedSlot,
  onBack,
  activeSubscription,
  onSubmitStart,
  onSubmitSuccess,
  onSubmitError,
}: StudentInfoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(
    activeSubscription ? activeSubscription.id : null
  );
  const [successState, setSuccessState] = useState<{
    bookingId: string;
    headline: string;
    detail: string;
  } | null>(null);
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "checking" | "available" | "unavailable" | "error"
  >("checking");

  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    studentPhone: "",
    studentTimezone: detectUserTimezone(),
    isMinor: false,
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    notes: "",
  });

  const zonedStart = toZonedTime(selectedSlot.start, tutor.timezone);
  const zonedEnd = toZonedTime(selectedSlot.end, tutor.timezone);
  const isFreeService = service.price_amount === 0;
  const priceCurrency = service.price_currency?.toUpperCase?.() || service.price_currency;
  const priceDisplay = isFreeService ? "Free" : formatCurrency(service.price_amount, priceCurrency);
  const hasAvailableCredits = !!(activeSubscription && activeSubscription.lessonsAvailable > 0);
  const usingCredits = hasAvailableCredits && selectedSubscriptionId === activeSubscription?.id;
  const paymentLabel = isFreeService
    ? "No payment required"
    : usingCredits
    ? `Subscription credits (${activeSubscription?.lessonsAvailable ?? 0} left)`
    : hasAvailableCredits
    ? "Use credits or pay after confirm"
    : "Secure checkout after confirm";
  const paymentDescription = isFreeService
    ? "This session is free. No payment is required."
    : usingCredits
    ? "This booking will use your subscription credits. No charge today."
    : "You will complete payment via secure checkout after confirming your details.";
  const availabilityLabel = {
    checking: "Checking availability…",
    available: "Still available",
    unavailable: "Recently booked",
    error: "Unable to confirm availability",
  }[availabilityStatus];

  const setFormattedError = (message: string) => {
    const formatted = formatBookingError(message) ?? message;
    setError(formatted);
    onSubmitError?.(formatted);
  };

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const checkAvailability = async () => {
      setAvailabilityStatus("checking");
      try {
        const res = await fetch("/api/booking/check-slot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tutorId: tutor.id,
            startISO: selectedSlot.startISO,
            durationMinutes: service.duration_minutes,
          }),
        });
        if (!res.ok) throw new Error("Request failed");
        const body = (await res.json()) as { available?: boolean };
        if (cancelled) return;
        setAvailabilityStatus(body.available ? "available" : "unavailable");
      } catch {
        if (!cancelled) {
          setAvailabilityStatus("error");
        }
      }
    };
    checkAvailability();
    return () => {
      cancelled = true;
    };
  }, [selectedSlot.startISO, service.duration_minutes, tutor.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (availabilityStatus === "unavailable") {
      setFormattedError("This time was just booked. Please pick another slot.");
      return;
    }

    // Validation
    if (!formData.studentName || !formData.studentEmail) {
      setFormattedError("Please provide student name and email.");
      const el = document.getElementById(!formData.studentName ? "studentName" : "studentEmail");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (formData.isMinor && (!formData.parentName || !formData.parentEmail)) {
      setFormattedError("Please provide parent or guardian information for minor students.");
      const el = document.getElementById(!formData.parentName ? "parentName" : "parentEmail");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    onSubmitStart?.();
    startTransition(async () => {
      try {
        // Generate unique mutation ID for idempotency (prevents duplicate bookings)
        const clientMutationId = crypto.randomUUID();

        const result = await createBookingAndCheckout({
          tutorId: tutor.id,
          serviceId: service.id,
          scheduledAt: selectedSlot.startISO,
          durationMinutes: service.duration_minutes,
          timezone: tutor.timezone,
          student: {
            fullName: formData.studentName,
            email: formData.studentEmail,
            phone: formData.studentPhone || null,
            timezone: formData.studentTimezone,
            parentName: formData.isMinor ? formData.parentName : null,
            parentEmail: formData.isMinor ? formData.parentEmail : null,
            parentPhone: formData.isMinor ? formData.parentPhone : null,
          },
          notes: formData.notes || null,
          amount: service.price_amount,
          currency: service.price_currency,
          subscriptionId: !isFreeService ? selectedSubscriptionId || undefined : undefined,
          clientMutationId,
        });

        if ("error" in result) {
          setFormattedError(result.error);
          return;
        }

        if ("bookingId" in result) {
          onSubmitSuccess?.({
            bookingId: result.bookingId,
            checkoutUrl: result.checkoutUrl ?? null,
          });
          if (result.checkoutUrl) {
            // Redirect to Stripe checkout
            setRedirectingToCheckout(true);
            redirectTimeoutRef.current = setTimeout(() => {
              window.location.href = result.checkoutUrl as string;
            }, 120);
          } else {
            const nextStep = isFreeService
              ? "No payment is required. Check your email for confirmation details."
              : "Your tutor will email payment instructions and confirm your booking.";
            setSuccessState({
              bookingId: result.bookingId,
              headline: isFreeService ? "Lesson booked" : "Booking request sent",
              detail: nextStep,
            });
            redirectTimeoutRef.current = setTimeout(() => {
              router.push(`/book/success?booking_id=${result.bookingId}`);
            }, 500);
          }
        } else {
          setFormattedError("We could not create your booking. Please try again.");
        }
      } catch (err) {
        console.error("Booking error:", err);
        setFormattedError("An error occurred. Please try again.");
      }
    });
  };

  if (redirectingToCheckout) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          Redirecting to secure checkout…
        </div>
      </div>
    );
  }

  if (successState) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <svg
              className="h-6 w-6 text-emerald-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-emerald-900">{successState.headline}</h2>
          <p className="mt-2 text-sm text-emerald-800">{successState.detail}</p>
          <button
            type="button"
            onClick={() => router.push(`/book/success?booking_id=${successState.bookingId}`)}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
          >
            View booking details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="text-blue-600 hover:underline mb-6 flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 19l-7-7 7-7"></path>
        </svg>
        Back to time slots
      </button>

      <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-2">Complete Your Booking</h1>
        <p className="text-gray-600 mb-6">
          You&apos;re booking a {service.duration_minutes}-minute {service.name} session with {tutor.fullName}
        </p>

        {/* Selected Time Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Selected Time</p>
          <p className="font-semibold text-lg">
            {format(zonedStart, "EEEE, MMMM d, yyyy")}
          </p>
          <p className="text-gray-700">
            {format(zonedStart, "h:mm a")} - {format(zonedEnd, "h:mm a")} ({tutor.timezone})
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700">
            <span
              className={
                availabilityStatus === "available"
                  ? "h-2 w-2 rounded-full bg-emerald-500"
                  : availabilityStatus === "checking"
                  ? "h-2 w-2 rounded-full bg-amber-400"
                  : "h-2 w-2 rounded-full bg-red-500"
              }
            />
            {availabilityLabel}
          </div>
          {availabilityStatus === "error" ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              We could not confirm availability. You can still submit, and we will verify before confirming.
            </div>
          ) : null}
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Lesson</span>
              <span>{priceDisplay}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Fees</span>
              <span>$0</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{priceDisplay}</span>
            </div>
            <p className="pt-1 text-xs text-gray-600">Payment: {paymentLabel}</p>
          </div>
        </div>

        {/* Payment summary */}
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-blue-900">Payment method</p>
              <p className="text-xs text-blue-800">{paymentDescription}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              {isFreeService ? "Free" : usingCredits ? "Credits" : "Checkout"}
            </span>
          </div>
        </div>

        {/* Student Information Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Student Information</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMinor"
                  checked={formData.isMinor}
                  onChange={(e) => setFormData({ ...formData, isMinor: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                />
                <label htmlFor="isMinor" className="text-sm text-gray-700">
                  Student is under 18 years old
                </label>
              </div>

              <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="studentName"
                  required
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Student&apos;s full name"
                />
              </div>

              <div>
                <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="studentEmail"
                  required
                  value={formData.studentEmail}
                  onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="student@example.com"
                />
              </div>

              <div>
                <label htmlFor="studentPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  id="studentPhone"
                  value={formData.studentPhone}
                  onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label htmlFor="studentTimezone" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Timezone
                </label>
                <TimezoneSelect
                  id="studentTimezone"
                  value={formData.studentTimezone}
                  onChange={(timezone) => setFormData({ ...formData, studentTimezone: timezone })}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Auto-detected from your device. Adjust if you&apos;re traveling.
                </p>
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information (conditional) */}
          {formData.isMinor && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Parent/Guardian Information</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="parentName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="parentName"
                    required={formData.isMinor}
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Parent&apos;s full name"
                  />
                </div>

                <div>
                  <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="parentEmail"
                    required={formData.isMinor}
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="parent@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number (optional)
                  </label>
                  <input
                    type="tel"
                    id="parentPhone"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Subscription Credit Option */}
          {!isFreeService && activeSubscription && activeSubscription.lessonsAvailable > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Payment Option</h2>
              <SubscriptionCreditSelector
                subscription={activeSubscription}
                selected={usingCredits}
                onSelect={setSelectedSubscriptionId}
                disabled={isPending}
              />
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Any specific goals or questions for the tutor?"
            />
          </div>

          {/* Error Message */}
          <FormStatusAlert
            message={error || undefined}
            tone="error"
            ariaLive="assertive"
            className="rounded-lg border border-destructive/20 bg-destructive/10"
          />

          {isPending ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              Submitting your booking…
            </div>
          ) : null}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Creating Booking..." : "Confirm Booking"}
          </button>

          <p className="text-xs text-gray-500 text-center">
            {isFreeService
              ? "No payment is required. Your lesson will be confirmed immediately."
              : "After booking, you&apos;ll receive payment instructions from your tutor. Your lesson will be confirmed once payment is received."}
          </p>
        </form>
      </div>
    </div>
  );
}
