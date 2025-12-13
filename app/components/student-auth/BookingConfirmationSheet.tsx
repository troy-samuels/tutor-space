"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Clock,
  CreditCard,
  Package,
  Loader2,
  CheckCircle,
  X,
  User,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createStudentBooking, type StudentPackage } from "@/lib/actions/student-bookings";
import type { TutorSearchResult } from "@/lib/actions/student-connections";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: number;
  price_currency: string;
};

type Subscription = {
  id: string;
  status: string;
  lessonsAvailable: number;
  lessonsPerMonth: number;
  currentPeriodEnd: string | null;
} | null;

type PaymentMethod = "subscription" | "package" | "direct";

type BookingConfirmationSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutor: TutorSearchResult;
  service: Service;
  slot: { start: string; end: string };
  timezone: string;
  packages: StudentPackage[];
  subscription: Subscription;
};

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

function formatDateTime(isoString: string, timezone: string): { date: string; time: string } {
  const date = new Date(isoString);
  return {
    date: date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: timezone,
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    }),
  };
}

export function BookingConfirmationSheet({
  open,
  onOpenChange,
  tutor,
  service,
  slot,
  timezone,
  packages,
  subscription,
}: BookingConfirmationSheetProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    // Default to subscription if available
    if (subscription && subscription.lessonsAvailable > 0) return "subscription";
    // Then package if available
    const validPackage = packages.find((p) => p.remaining_minutes >= service.duration_minutes);
    if (validPackage) return "package";
    // Otherwise direct payment
    return "direct";
  });
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(() => {
    const validPackage = packages.find((p) => p.remaining_minutes >= service.duration_minutes);
    return validPackage?.purchase_id || null;
  });
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const { date, time } = formatDateTime(slot.start, timezone);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const availablePackages = packages.filter(
    (p) => p.remaining_minutes >= service.duration_minutes
  );
  const hasSubscription = subscription && subscription.lessonsAvailable > 0;

  const handleConfirm = () => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await createStudentBooking({
          tutorId: tutor.id,
          serviceId: service.id,
          scheduledAt: slot.start,
          durationMinutes: service.duration_minutes,
          notes: notes.trim() || null,
          amount: paymentMethod === "direct" ? service.price_amount : 0,
          currency: service.price_currency,
          packageId: paymentMethod === "package" ? selectedPackageId || undefined : undefined,
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        if (result.checkoutUrl) {
          // Redirect to Stripe checkout
          window.location.href = result.checkoutUrl;
          return;
        }

        // Booking created successfully (using credits)
        setSuccess(true);
        setBookingId(result.bookingId || null);
      } catch (err) {
        console.error("Booking error:", err);
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const handleViewCalendar = () => {
    router.push("/student/calendar");
  };

  const handleBookAnother = () => {
    setSuccess(false);
    setBookingId(null);
    setNotes("");
    onOpenChange(false);
  };

  // Success state
  if (success) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} side="right">
        <SheetContent className="flex flex-col p-0 w-full max-w-md">
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Lesson Booked!</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              Your lesson with {tutor.full_name || tutor.username} has been confirmed.
            </p>
            <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">{date}</p>
              <p className="text-muted-foreground">{time}</p>
            </div>
            <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
              <button
                onClick={handleViewCalendar}
                className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                View Calendar
              </button>
              <button
                onClick={handleBookAnother}
                className="w-full rounded-lg border border-border px-4 py-2.5 font-medium text-foreground hover:bg-muted transition"
              >
                Book Another Lesson
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent className="flex flex-col p-0 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">Confirm Booking</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 hover:bg-muted transition"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Tutor info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={tutor.avatar_url || undefined} alt={tutor.full_name || "Tutor"} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {getInitials(tutor.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">
                {tutor.full_name || tutor.username}
              </p>
              {tutor.tagline && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {tutor.tagline}
                </p>
              )}
            </div>
          </div>

          {/* Booking details */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CalendarCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{date}</p>
                <p className="text-sm text-muted-foreground">{time}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{service.name}</p>
                <p className="text-sm text-muted-foreground">
                  {service.duration_minutes} minutes
                </p>
              </div>
            </div>
          </div>

          {/* Payment method selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Payment Method</h3>

            {/* Subscription option */}
            {hasSubscription && (
              <button
                type="button"
                onClick={() => setPaymentMethod("subscription")}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border p-4 text-left transition",
                  paymentMethod === "subscription"
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/20"
                    : "border-border bg-white hover:border-blue-300"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Use Subscription</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription!.lessonsAvailable} lesson
                    {subscription!.lessonsAvailable !== 1 ? "s" : ""} available
                  </p>
                </div>
                <span className="text-sm font-semibold text-blue-600">No charge</span>
              </button>
            )}

            {/* Package option */}
            {availablePackages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("package");
                  if (!selectedPackageId && availablePackages[0]) {
                    setSelectedPackageId(availablePackages[0].purchase_id);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border p-4 text-left transition",
                  paymentMethod === "package"
                    ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/20"
                    : "border-border bg-white hover:border-emerald-300"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Use Package</p>
                  <p className="text-sm text-muted-foreground">
                    {availablePackages.reduce((sum, p) => sum + p.remaining_minutes, 0)} min
                    available
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-600">No charge</span>
              </button>
            )}

            {/* Package selector (if multiple) */}
            {paymentMethod === "package" && availablePackages.length > 1 && (
              <div className="ml-13 space-y-2">
                {availablePackages.map((pkg) => (
                  <button
                    key={pkg.purchase_id}
                    type="button"
                    onClick={() => setSelectedPackageId(pkg.purchase_id)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition",
                      selectedPackageId === pkg.purchase_id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-border hover:border-emerald-300"
                    )}
                  >
                    <span>{pkg.name}</span>
                    <span className="text-muted-foreground">{pkg.remaining_minutes} min</span>
                  </button>
                ))}
              </div>
            )}

            {/* Direct payment option */}
            <button
              type="button"
              onClick={() => setPaymentMethod("direct")}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border p-4 text-left transition",
                paymentMethod === "direct"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-white hover:border-primary/40"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Pay Now</p>
                <p className="text-sm text-muted-foreground">Card payment via Stripe</p>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {formatPrice(service.price_amount, service.price_currency)}
              </span>
            </button>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label
              htmlFor="booking-notes"
              className="text-sm font-medium text-foreground"
            >
              Notes for tutor (optional)
            </label>
            <textarea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any topics you'd like to cover, questions, etc."
              rows={3}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : paymentMethod === "direct" ? (
              <>
                Continue to Payment
                <span className="text-primary-foreground/80">
                  ({formatPrice(service.price_amount, service.price_currency)})
                </span>
              </>
            ) : (
              "Confirm Booking"
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
