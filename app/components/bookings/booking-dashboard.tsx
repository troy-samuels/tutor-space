"use client";

import { useMemo, useState, useTransition } from "react";
import type { BookingRecord } from "@/lib/actions/bookings";
import { createBooking, markBookingAsPaid } from "@/lib/actions/bookings";
import type { StudentRecord } from "@/lib/actions/students";
import { ensureStudent } from "@/lib/actions/students";
import type { AvailabilitySlotInput } from "@/lib/validators/availability";
import {
  generateBookingSlots,
  type GeneratedSlot,
  type TimeWindow,
} from "@/lib/utils/scheduling";
import { formatInTimeZone } from "date-fns-tz";

type ServiceSummary = {
  id: string;
  name: string;
  duration_minutes: number;
};

type BookingDashboardProps = {
  bookings: BookingRecord[];
  students: StudentRecord[];
  services: ServiceSummary[];
  timezone: string;
  availability: AvailabilitySlotInput[];
  busyWindows: TimeWindow[];
};

type BookingFormState = {
  serviceId: string | null;
  studentId: string | null;
  name: string;
  email: string;
  slot: GeneratedSlot | null;
  notes: string;
};

export function BookingDashboard({
  bookings,
  students,
  services,
  timezone,
  availability,
  busyWindows,
}: BookingDashboardProps) {
  const [bookingList, setBookingList] = useState<BookingRecord[]>(bookings);
  const [formState, setFormState] = useState<BookingFormState>(() => ({
    serviceId: services[0]?.id ?? null,
    studentId: students[0]?.id ?? null,
    name: "",
    email: "",
    slot: null,
    notes: "",
  }));
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [paymentPending, startPaymentTransition] = useTransition();

  const upcomingBookings = useMemo(
    () => bookingList.filter((booking) => new Date(booking.scheduled_at).getTime() >= Date.now()),
    [bookingList]
  );
  const pastBookings = useMemo(
    () => bookingList.filter((booking) => new Date(booking.scheduled_at).getTime() < Date.now()),
    [bookingList]
  );

  const generatedSlots = useMemo(() => {
    if (!formState.serviceId) return [];
    const baseSlots = generateBookingSlots({
      availability,
      timezone,
      busyWindows,
    });
    return baseSlots.filter((slot) =>
      bookingList.every((booking) => {
        const bookingStart = new Date(booking.scheduled_at).getTime();
        const slotStart = new Date(slot.start).getTime();
        return bookingStart !== slotStart;
      })
    );
  }, [availability, formState.serviceId, timezone, bookingList, busyWindows]);

  function resetForm() {
    setFormState((prev) => ({
      ...prev,
      slot: null,
      notes: "",
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const service = services.find((item) => item.id === formState.serviceId) ?? null;
    const slot = formState.slot;

    if (!service) {
      setStatus({ type: "error", message: "Select a service." });
      return;
    }

    if (!slot) {
      setStatus({ type: "error", message: "Choose a time slot." });
      return;
    }

    startTransition(() => {
      (async () => {
        let studentId = formState.studentId;
        if (!studentId) {
          if (!formState.name || !formState.email) {
            setStatus({ type: "error", message: "Add student name and email." });
            return;
          }
          const ensured = await ensureStudent({
            full_name: formState.name,
            email: formState.email,
          });
          if (ensured.error || !ensured.data) {
            setStatus({ type: "error", message: ensured.error ?? "Could not create student." });
            return;
          }
          studentId = ensured.data.id;
        }

        const result = await createBooking({
          service_id: service.id,
          student_id: studentId!,
          scheduled_at: slot.start,
          duration_minutes: service.duration_minutes,
          timezone,
          notes: formState.notes,
        });

        if (result.error || !result.data) {
          setStatus({ type: "error", message: result.error ?? "Could not create booking." });
          return;
        }

        setBookingList((prev) => [...prev, result.data!].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));
        setStatus({ type: "success", message: "Booking created." });
        resetForm();
      })();
    });
  }

  function handleMarkAsPaid(bookingId: string) {
    setStatus(null);
    startPaymentTransition(() => {
      (async () => {
        const result = await markBookingAsPaid(bookingId);

        if (result.error) {
          setStatus({ type: "error", message: result.error });
          return;
        }

        // Update local state optimistically
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
            Review upcoming lessons and add manual bookings for students who confirm outside the funnel.
          </p>
        </div>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          <BookingList
            title="Upcoming"
            bookings={upcomingBookings}
            timezone={timezone}
            onMarkAsPaid={handleMarkAsPaid}
            isPending={paymentPending}
          />
          <BookingList
            title="Past"
            bookings={pastBookings}
            timezone={timezone}
            onMarkAsPaid={handleMarkAsPaid}
            isPending={paymentPending}
            collapsed
          />
        </section>

        <section className="rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur">
          <h2 className="text-base font-semibold text-foreground">Add booking</h2>
          <p className="text-xs text-muted-foreground">
            Manual bookings work well for trial sessions or when students pay via bank transfer. They’re marked unpaid by default.
          </p>
          <form className="mt-4 space-y-4 text-sm" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2">
              <span className="font-medium text-foreground">Service</span>
              <select
                value={formState.serviceId ?? ""}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    serviceId: event.target.value || null,
                  }))
                }
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
              >
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-medium text-foreground">Existing student</span>
              <select
                value={formState.studentId ?? ""}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    studentId: event.target.value || null,
                  }))
                }
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
              >
                <option value="">New student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.email})
                  </option>
                ))}
              </select>
            </label>

            {!formState.studentId ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="font-medium text-foreground">Student name</span>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                    className="rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="font-medium text-foreground">Student email</span>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                    className="rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
                  />
                </label>
              </div>
            ) : null}

            <label className="flex flex-col gap-2">
              <span className="font-medium text-foreground">Choose slot</span>
              <select
                value={formState.slot?.start ?? ""}
                onChange={(event) => {
                  const selected = generatedSlots.find((slot) => slot.start === event.target.value) ?? null;
                  setFormState((prev) => ({ ...prev, slot: selected }));
                }}
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
              >
                <option value="">Select upcoming slot</option>
                {generatedSlots.map((slot) => (
                  <option key={slot.start} value={slot.start}>
                    {slot.day_label} · {slot.time_label}
                  </option>
                ))}
              </select>
              {generatedSlots.length === 0 ? (
                <span className="text-xs text-destructive">
                  Add availability to generate bookable slots.
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-medium text-foreground">Internal notes</span>
              <textarea
                value={formState.notes}
                onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm leading-relaxed shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
                placeholder="Optional reminders or context for this session."
              />
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-full bg-brand-brown px-4 text-sm font-semibold text-brand-white shadow-sm transition hover:bg-brand-brown/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Adding..." : "Add booking"}
            </button>
          </form>
        </section>
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
}: {
  title: string;
  bookings: BookingRecord[];
  timezone: string;
  onMarkAsPaid: (bookingId: string) => void;
  isPending: boolean;
  collapsed?: boolean;
}) {
  if (bookings.length === 0) {
    return (
      <section className="rounded-3xl border border-brand-brown/20 bg-white/90 p-6 text-sm text-muted-foreground shadow-sm backdrop-blur">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">No bookings yet.</p>
      </section>
    );
  }

  const items = collapsed ? bookings.slice(0, 5) : bookings;

  return (
    <section className="rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {collapsed && bookings.length > 5 ? (
          <span className="text-xs text-muted-foreground">
            Showing next {items.length} of {bookings.length}
          </span>
        ) : null}
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((booking) => {
          const isPaid = booking.payment_status === "paid";
          const isPending_payment = booking.payment_status === "unpaid";
          const isConfirmed = booking.status === "confirmed";

          return (
            <li
              key={booking.id}
              className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                isPaid
                  ? "border-emerald-200 bg-emerald-50/50"
                  : isPending_payment
                    ? "border-amber-200 bg-amber-50/50"
                    : "border-brand-brown/15 bg-brand-brown/5"
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
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {booking.status}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${
                      isPaid
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {booking.payment_status}
                  </span>
                </div>
              </div>

              {/* Show meeting link if available */}
              {booking.meeting_url && (
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
                    href={booking.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-brown hover:underline truncate"
                  >
                    Join on {booking.meeting_provider === "zoom_personal" ? "Zoom" : booking.meeting_provider === "google_meet" ? "Google Meet" : booking.meeting_provider === "custom" ? "Video Call" : "Meeting"}
                  </a>
                </div>
              )}

              {/* Show "Mark as Paid" button for unpaid bookings */}
              {isPending_payment && (
                <div className="flex items-center gap-2 pt-2 border-t border-current/10">
                  <button
                    onClick={() => onMarkAsPaid(booking.id)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-brown px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-brown/90 disabled:cursor-not-allowed disabled:opacity-60"
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
                    Click after student has paid via Venmo/PayPal/Zelle
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
