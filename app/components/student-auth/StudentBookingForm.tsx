"use client";

import { useState, useTransition, useEffect } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ArrowLeft, Calendar, Clock, DollarSign, Loader2, CheckCircle, Package, CreditCard } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { BookableSlot } from "@/lib/utils/slots";
import type { TutorWithDetails, StudentPackage } from "@/lib/actions/types";
import { createStudentBooking, getStudentPackagesForTutor } from "@/lib/actions/student-bookings";
import { formatCurrency } from "@/lib/utils";
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

interface StudentBookingFormProps {
  tutor: TutorWithDetails;
  service: Service;
  slot: BookableSlot;
  onBack: () => void;
  onSuccess: () => void;
}

export function StudentBookingForm({
  tutor,
  service,
  slot,
  onBack,
  onSuccess,
}: StudentBookingFormProps) {
  const totalSteps = 3;
  const currentStep = 2; // Step 1: pick time, Step 2: confirm & payment, Step 3: success
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successStatus, setSuccessStatus] = useState<"confirmed" | "pending">("confirmed");
  const [notes, setNotes] = useState("");

  // Payment method state
  const [packages, setPackages] = useState<StudentPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"package" | "direct">("direct");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const zonedStart = toZonedTime(slot.start, tutor.timezone);
  const zonedEnd = toZonedTime(slot.end, tutor.timezone);
  const isFreeService = service.price_amount === 0;
  const priceDisplay = isFreeService ? "Free" : formatCurrency(service.price_amount, service.price_currency);

  // Load available packages on mount
  useEffect(() => {
    async function loadPackages() {
      if (isFreeService) {
        setPackages([]);
        setPaymentMethod("direct");
        setSelectedPackageId(null);
        setLoadingPackages(false);
        return;
      }

      setLoadingPackages(true);
      const result = await getStudentPackagesForTutor(tutor.id);
      if (result.packages) {
        // Only show packages with enough minutes for this service
        const eligiblePackages = result.packages.filter(
          (pkg) => pkg.remaining_minutes >= service.duration_minutes
        );
        setPackages(eligiblePackages);
        // Auto-select first package if available
        if (eligiblePackages.length > 0) {
          setPaymentMethod("package");
          setSelectedPackageId(eligiblePackages[0].id);
        }
      }
      setLoadingPackages(false);
    }
    loadPackages();
  }, [tutor.id, service.duration_minutes, isFreeService]);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const setFormattedError = (message: string) => {
    setError(formatBookingError(message) ?? message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate package selection if using package payment
    if (paymentMethod === "package" && !selectedPackageId) {
      setFormattedError("Please select a package to use.");
      return;
    }

    startTransition(async () => {
      try {
        const clientMutationId = crypto.randomUUID();
        const result = await createStudentBooking({
          tutorId: tutor.id,
          serviceId: service.id,
          scheduledAt: slot.startISO,
          durationMinutes: service.duration_minutes,
          notes: notes || null,
          amount: service.price_amount,
          currency: service.price_currency,
          packageId:
            !isFreeService && paymentMethod === "package" ? selectedPackageId ?? undefined : undefined,
          clientMutationId,
        });

        if (result.error) {
          setFormattedError(result.error);
          return;
        }

        if (result.checkoutUrl) {
          // Redirect to Stripe checkout
          window.location.href = result.checkoutUrl;
          return;
        }

        if (result.success) {
          const isInstantConfirm = isFreeService || paymentMethod === "package";
          setSuccessStatus(isInstantConfirm ? "confirmed" : "pending");
          setSuccess(true);
          // Wait a moment then refresh
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } catch (err) {
        console.error("Booking error:", err);
        setFormattedError("An error occurred. Please try again.");
      }
    });
  };

  if (success) {
    const isConfirmed = successStatus === "confirmed";
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isConfirmed ? "Booking Confirmed!" : "Booking Requested"}
        </h2>
        <p className="text-muted-foreground mb-4">
          {isConfirmed
            ? `Your lesson with ${tutor.full_name || `@${tutor.username}`} has been scheduled.`
            : `Your booking request was sent to ${tutor.full_name || `@${tutor.username}`}.`}
        </p>
        <p className="text-sm text-muted-foreground">
          {format(zonedStart, "EEEE, MMMM d, yyyy")} at {format(zonedStart, "h:mm a")}
        </p>
        {!isConfirmed && (
          <p className="mt-2 text-xs text-muted-foreground">
            You&apos;ll receive payment instructions once the tutor confirms your booking.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to time slots
      </button>

      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>
              Step {currentStep} of {totalSteps}
            </span>
            <span>Confirm & Payment</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-6">Confirm Your Booking</h2>

        {/* Tutor Info */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={tutor.avatar_url || undefined}
              alt={tutor.full_name || "Tutor avatar"}
            />
            <AvatarFallback className="bg-primary/20 text-primary">
              {getInitials(tutor.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{tutor.full_name || `@${tutor.username}`}</div>
            <div className="text-sm text-muted-foreground">@{tutor.username}</div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">{format(zonedStart, "EEEE, MMMM d, yyyy")}</div>
              <div className="text-sm text-muted-foreground">
                {format(zonedStart, "h:mm a")} - {format(zonedEnd, "h:mm a")} ({tutor.timezone})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">{service.name}</div>
              <div className="text-sm text-muted-foreground">{service.duration_minutes} minutes</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {priceDisplay}
              </div>
              <div className="text-sm text-muted-foreground">
                {isFreeService
                  ? "No payment required"
                  : paymentMethod === "package" && selectedPackageId
                  ? "Using package credit · no charge"
                  : "Secure checkout after confirm"}
              </div>
            </div>
          </div>
        </div>

        {/* Payment summary */}
        <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">
                {isFreeService
                  ? "Free lesson"
                  : paymentMethod === "package" && selectedPackageId
                  ? "Using session package"
                  : "Pay with card"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isFreeService
                  ? "No payment is required for this booking."
                  : paymentMethod === "package" && selectedPackageId
                  ? "1 session credit will be applied. No payment required today."
                  : `You will pay ${priceDisplay} via secure checkout after confirming.`}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">
              {isFreeService
                ? "Free"
                : paymentMethod === "package" && selectedPackageId
                ? "Credits"
                : "Checkout"}
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        {!isFreeService && !loadingPackages && (packages.length > 0 || true) && (
          <div className="py-4 border-t border-border">
            <h3 className="text-sm font-semibold mb-3">Payment Method</h3>

            <div className="space-y-2">
              {/* Package Option - only show if packages available */}
              {packages.length > 0 && (
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    paymentMethod === "package"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="package"
                    checked={paymentMethod === "package"}
                    onChange={() => setPaymentMethod("package")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium">Use Session Package</span>
                    </div>
                    {paymentMethod === "package" && (
                      <div className="mt-2 space-y-2">
                        {packages.map((pkg) => (
                          <label
                            key={pkg.id}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                              selectedPackageId === pkg.id
                                ? "bg-primary/10 border border-primary/30"
                                : "bg-muted/30 hover:bg-muted/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="selectedPackage"
                              value={pkg.id}
                              checked={selectedPackageId === pkg.id}
                              onChange={() => setSelectedPackageId(pkg.id)}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{pkg.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {pkg.remaining_minutes} min remaining
                                {pkg.expires_at && (
                                  <> · Expires {format(new Date(pkg.expires_at), "MMM d, yyyy")}</>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              )}

              {/* Direct Payment Option */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "direct"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="direct"
                  checked={paymentMethod === "direct"}
                  onChange={() => setPaymentMethod("direct")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="font-medium">Pay Directly</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(service.price_amount, service.price_currency)} - Pay with card or follow tutor&apos;s payment instructions
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {!isFreeService && loadingPackages && (
          <div className="py-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking for session packages...
            </div>
          </div>
        )}

        {/* Notes Form */}
        <form onSubmit={handleSubmit} className="pt-4 border-t border-border space-y-4">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">
              Notes for your tutor (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition"
              placeholder="Any specific topics or questions you'd like to cover?"
            />
          </div>

          <FormStatusAlert
            message={error || undefined}
            tone="error"
            ariaLive="assertive"
            className="rounded-lg border border-destructive/20 bg-destructive/10"
          />

          <button
            type="submit"
            disabled={isPending || loadingPackages}
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : paymentMethod === "package" ? (
              <>
                <Package className="h-4 w-4" />
                Use Package & Confirm
              </>
            ) : (
              "Confirm Booking"
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            {isFreeService
              ? "No payment is required. Your lesson will be confirmed immediately."
              : paymentMethod === "package"
              ? `This will deduct ${service.duration_minutes} minutes from your selected package.`
              : "Your tutor will send payment instructions after the booking is confirmed."}
          </p>
        </form>
      </div>
    </div>
  );
}
