"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays, CalendarPlus, Clock, Video, RefreshCw, Sparkles } from "lucide-react";
import { RescheduleModal } from "@/components/booking/RescheduleModal";
import { useAuth } from "@/lib/hooks/useAuth";
import type { BookingRecord } from "@/lib/actions/bookings";
import { markBookingAsPaid } from "@/lib/actions/bookings";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buildClassroomUrl, isClassroomUrl } from "@/lib/utils/classroom-links";
import Link from "next/link";

type BookingDashboardProps = {
  bookings: BookingRecord[];
  timezone: string;
  tutorId: string;
};

function getMeetingProviderLabel(provider?: string | null): string {
  switch (provider) {
    case "zoom_personal":
      return "Zoom";
    case "google_meet":
      return "Google Meet";
    case "microsoft_teams":
      return "Microsoft Teams";
    case "calendly":
      return "Calendly";
    case "livekit":
      return "Classroom";
    case "custom":
      return "Video Call";
    default:
      return "Meeting";
  }
}

export function BookingDashboard({
  bookings,
  timezone,
  tutorId,
}: BookingDashboardProps) {
  const router = useRouter();
  const [bookingList, setBookingList] = useState<BookingRecord[]>(bookings);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [paymentPending, startPaymentTransition] = useTransition();

  const handleRescheduleSuccess = () => {
    router.refresh();
  };

  useEffect(() => {
    setBookingList(bookings);
  }, [bookings]);

  const today = useMemo(() => new Date(), []);

  const todaysLessons = useMemo(() => {
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    return bookingList.filter((booking) => {
      const bookingDate = new Date(booking.scheduled_at);
      return bookingDate >= todayStart && bookingDate <= todayEnd;
    }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [bookingList, today]);

  const upcomingBookings = useMemo(
    () => bookingList.filter((booking) => new Date(booking.scheduled_at).getTime() >= Date.now()),
    [bookingList]
  );
  const pastBookings = useMemo(
    () => bookingList.filter((booking) => new Date(booking.scheduled_at).getTime() < Date.now()),
    [bookingList]
  );

  function handleMarkAsPaid(bookingId: string) {
    setStatus(null);
    startPaymentTransition(() => {
      (async () => {
        const result = await markBookingAsPaid(bookingId);

        if (result.error) {
          setStatus({ type: "error", message: result.error });
          return;
        }

        setBookingList((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "confirmed", payment_status: "paid" }
              : booking
          )
        );
        setStatus({ type: "success", message: "Booking marked as paid." });
      })();
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Review upcoming lessons and manage your calendar.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/calendar?action=book">
            <CalendarPlus className="h-4 w-4" />
            Book via Calendar
          </Link>
        </Button>
      </header>

      {status ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            status.type === "success"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {status.message}
        </p>
      ) : null}

      {/* Today's Lessons Calendar View */}
      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Today&apos;s Lessons
          </h2>
          <span className="text-xs text-muted-foreground">
            {format(today, "EEE, MMM d")}
          </span>
        </div>

        {todaysLessons.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground mb-1">No lessons scheduled for today</p>
            <p className="text-xs text-muted-foreground">Click &quot;Book via Calendar&quot; to schedule a lesson.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todaysLessons.map((lesson) => {
              const time = format(new Date(lesson.scheduled_at), "h:mm a");
              const initials = lesson.students?.full_name
                ? lesson.students.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "?";

              return (
                <Link
                  key={lesson.id}
                  href={`/students/${lesson.students?.id || "#"}`}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 shadow-sm transition-all group"
                >
                  <Avatar className="h-9 w-9 shrink-0 ring-2 ring-background">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {lesson.students?.full_name || "Unknown Student"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lesson.services?.name || "Lesson"}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {time}
                      </span>
                      <span>•</span>
                      <span>{lesson.duration_minutes}m</span>
                      {lesson.meeting_url && (
                        <>
                          <span>•</span>
                          <Video className="h-3 w-3 text-primary" />
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          lesson.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : lesson.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : lesson.status === "completed"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {lesson.status}
                      </span>
                      {lesson.payment_status === "paid" && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Booking Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BookingList
          title="Upcoming"
          bookings={upcomingBookings}
          timezone={timezone}
          onMarkAsPaid={handleMarkAsPaid}
          isPending={paymentPending}
          tutorId={tutorId}
          onRescheduleSuccess={handleRescheduleSuccess}
        />
        <BookingList
          title="Past"
          bookings={pastBookings}
          timezone={timezone}
          onMarkAsPaid={handleMarkAsPaid}
          isPending={paymentPending}
          tutorId={tutorId}
          collapsed
          onRescheduleSuccess={handleRescheduleSuccess}
        />
      </div>

    </div>
  );
}

function BookingList({
  title,
  bookings,
  timezone,
  onMarkAsPaid,
  isPending,
  collapsed,
  tutorId,
  onRescheduleSuccess,
}: {
  title: string;
  bookings: BookingRecord[];
  timezone: string;
  onMarkAsPaid: (bookingId: string) => void;
  isPending: boolean;
  collapsed?: boolean;
  tutorId: string;
  onRescheduleSuccess?: () => void;
}) {
  if (bookings.length === 0) {
    return (
      <section className="rounded-3xl border border-border bg-white/90 p-6 text-sm text-muted-foreground shadow-sm backdrop-blur">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">No bookings yet.</p>
      </section>
    );
  }

  // With scrollable containers, show all items
  const items = bookings;

  return (
    <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm backdrop-blur flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {bookings.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
          </span>
        )}
      </div>
      <ul className="mt-3 space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {items.map((booking) => (
          <BookingListItem
            key={booking.id}
            booking={booking}
            timezone={timezone}
            onMarkAsPaid={onMarkAsPaid}
            isPending={isPending}
            tutorId={tutorId}
            onRescheduleSuccess={onRescheduleSuccess}
          />
        ))}
      </ul>
    </section>
  );
}

type BookingListItemProps = {
  booking: BookingRecord;
  timezone: string;
  onMarkAsPaid: (bookingId: string) => void;
  isPending: boolean;
  tutorId: string;
  onRescheduleSuccess?: () => void;
};

function BookingListItem({
  booking,
  timezone,
  onMarkAsPaid,
  isPending,
  tutorId,
  onRescheduleSuccess,
}: BookingListItemProps) {
  const { entitlements } = useAuth();
  const hasStudioAccess = entitlements?.hasStudioAccess ?? false;
  const isPaid = booking.payment_status === "paid";
  const isPendingPayment = booking.payment_status === "unpaid";
  const isConfirmed = booking.status === "confirmed";
  const isCancelled = booking.status?.startsWith("cancelled");
  const [showRefund, setShowRefund] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundBusy, setRefundBusy] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const meetingUrl = booking.meeting_url ?? null;
  const meetingIsClassroom = isClassroomUrl(meetingUrl);
  const classroomUrl = buildClassroomUrl(booking.id, booking.short_code);

  const canReschedule = !isCancelled &&
    booking.status !== "completed" &&
    new Date(booking.scheduled_at) > new Date();

  return (
    <li
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
        isPaid
          ? "border-accent/30 bg-accent/10"
          : isPendingPayment
            ? "border-primary/30 bg-primary/10"
            : "border-border/60 bg-muted/50"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <p className="font-semibold text-foreground">
            {booking.students?.full_name ?? "Student"} · {booking.services?.name ?? "Service"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatInTimeZone(booking.scheduled_at, timezone, "EEE, MMM d · h:mm a")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${
              isConfirmed
                ? "bg-accent/20 text-accent"
                : "bg-primary/20 text-primary"
            }`}
          >
            {booking.status}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${
              isPaid
                ? "bg-accent/20 text-accent"
                : "bg-primary/20 text-primary"
            }`}
          >
            {booking.payment_status}
          </span>
        </div>
      </div>

      {meetingUrl && !meetingIsClassroom && (
        <div className="flex items-center gap-2 pt-2 border-t border-current/10">
          <svg
            className="h-4 w-4 text-muted-foreground flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline truncate"
          >
            Join on {getMeetingProviderLabel(booking.meeting_provider)}
          </a>
        </div>
      )}

      {/* Native Classroom Button */}
      <div className="flex items-center gap-2 pt-2 border-t border-current/10">
        {hasStudioAccess ? (
          <Link
            href={classroomUrl}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition"
          >
            <Video className="h-3.5 w-3.5" />
            Join Classroom
          </Link>
        ) : (
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Upgrade for Native Classroom
          </Link>
        )}
      </div>

      {/* Reschedule Button */}
      {canReschedule && (
        <div className="flex items-center gap-2 pt-2 border-t border-current/10">
          <button
            onClick={() => setShowReschedule(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reschedule
          </button>
        </div>
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={showReschedule}
        onClose={() => setShowReschedule(false)}
        booking={{
          id: booking.id,
          scheduled_at: booking.scheduled_at,
          duration_minutes: booking.duration_minutes,
          timezone: booking.timezone,
          students: booking.students,
          services: booking.services,
        }}
        userRole="tutor"
        onSuccess={() => {
          setShowReschedule(false);
          onRescheduleSuccess?.();
        }}
      />

      {isPendingPayment && (
        <div className="flex items-center gap-2 pt-2 border-t border-current/10">
          <button
            onClick={() => onMarkAsPaid(booking.id)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {isPending ? "Updating..." : "Mark as Paid"}
          </button>
          <span className="text-xs text-muted-foreground">
            Click after payment received
          </span>
        </div>
      )}

      {isPaid && (
        <div className="flex flex-col gap-2 pt-2 border-t border-current/10">
          {!showRefund ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRefund(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                Request refund
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs">
                <span className="block text-muted-foreground mb-1">Reason</span>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Optional reason"
                  className="w-full rounded-lg border px-3 py-1.5"
                />
              </label>
              <div className="flex items-center gap-2">
                <button
                  disabled={refundBusy}
                  onClick={async () => {
                    try {
                      setRefundBusy(true);
                      const amountCents = booking.payment_amount ?? 0;
                      const currency = booking.currency ?? "USD";
                      const res = await fetch("/api/refunds/request", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          tutorId,
                          bookingId: booking.id,
                          paymentsAuditId: null,
                          amountCents,
                          currency,
                          reason: refundReason || null,
                          actorRequested: "tutor",
                        }),
                      });
                      if (!res.ok) throw new Error("Failed to request refund");
                      setShowRefund(false);
                      setRefundReason("");
                      alert("Refund request sent.");
                    } catch (e) {
                      alert((e as Error).message);
                    } finally {
                      setRefundBusy(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {refundBusy ? "Sending..." : "Submit"}
                </button>
                <button
                  onClick={() => setShowRefund(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
