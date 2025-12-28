"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays, Clock, Plus, Video, RefreshCw, Sparkles } from "lucide-react";
import { RescheduleModal } from "@/components/booking/RescheduleModal";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { useAuth } from "@/lib/hooks/useAuth";
import type { BookingRecord, ManualBookingInput } from "@/lib/actions/bookings";
import { createManualBookingWithPaymentLink, markBookingAsPaid } from "@/lib/actions/bookings";
import type { StudentRecord } from "@/lib/actions/students";
import type { AvailabilitySlotInput } from "@/lib/validators/availability";
import {
  generateBookingSlots,
  type GeneratedSlot,
  type TimeWindow,
} from "@/lib/utils/scheduling";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FlowProgress } from "@/components/flows/FlowProgress";
import { detectUserTimezone } from "@/lib/utils/timezones";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

type ServiceSummary = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  currency: string;
};

type BookingDashboardProps = {
  bookings: BookingRecord[];
  students: StudentRecord[];
  services: ServiceSummary[];
  timezone: string;
  availability: AvailabilitySlotInput[];
  busyWindows: TimeWindow[];
  tutorId: string;
};

type PaymentOption = "send_link" | "already_paid" | "free";

type BookingFormState = {
  serviceId: string | null;
  studentId: string | null;
  name: string;
  email: string;
  studentTimezone: string;
  slot: GeneratedSlot | null;
  notes: string;
  paymentOption: PaymentOption;
};

const BOOKING_STEPS = [
  { id: "details", title: "Lesson", helper: "Pick service and time" },
  { id: "student", title: "Student", helper: "Select or add student" },
  { id: "confirm", title: "Review & Send", helper: "Payment and notes" },
] as const;

export function BookingDashboard({
  bookings,
  students,
  services,
  timezone,
  availability,
  busyWindows,
  tutorId,
}: BookingDashboardProps) {
  const router = useRouter();
  const [bookingList, setBookingList] = useState<BookingRecord[]>(bookings);

  const handleRescheduleSuccess = () => {
    // Refresh the page to get updated booking data
    router.refresh();
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<BookingFormState>(() => ({
    serviceId: services[0]?.id ?? null,
    studentId: students[0]?.id ?? null,
    name: "",
    email: "",
    studentTimezone: detectUserTimezone(),
    slot: null,
    notes: "",
    paymentOption: "send_link" as PaymentOption,
  }));
  const [bookingStepIndex, setBookingStepIndex] = useState(0);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [paymentPending, startPaymentTransition] = useTransition();
  const [selectedDay, setSelectedDay] = useState<string>("");

  const today = useMemo(() => new Date(), []);
  const selectedService = services.find((item) => item.id === formState.serviceId) ?? null;
  const selectedStudent = students.find((student) => student.id === formState.studentId);

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

  const dayOptions = useMemo(() => {
    const seen = new Set<string>();
    return generatedSlots.reduce<{ value: string; label: string }[]>((acc, slot) => {
      const key = format(new Date(slot.start), "yyyy-MM-dd");
      if (!seen.has(key)) {
        seen.add(key);
        acc.push({ value: key, label: slot.day_label });
      }
      return acc;
    }, []);
  }, [generatedSlots]);

  const timeOptions = useMemo(
    () =>
      selectedDay
        ? generatedSlots.filter((slot) => format(new Date(slot.start), "yyyy-MM-dd") === selectedDay)
        : [],
    [generatedSlots, selectedDay]
  );

  useEffect(() => {
    if (formState.slot) {
      const key = format(new Date(formState.slot.start), "yyyy-MM-dd");
      setSelectedDay(key);
      return;
    }
    if (dayOptions.length > 0 && !selectedDay) {
      setSelectedDay(dayOptions[0].value);
    }
  }, [formState.slot, dayOptions, selectedDay]);

  function resetForm() {
    setFormState({
      serviceId: services[0]?.id ?? null,
      studentId: students[0]?.id ?? null,
      name: "",
      email: "",
      studentTimezone: detectUserTimezone(),
      slot: null,
      notes: "",
      paymentOption: "send_link" as PaymentOption,
    });
    setBookingStepIndex(0);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const service = services.find((item) => item.id === formState.serviceId) ?? null;
    const slot = formState.slot;

    // Section 1: lock in service and time
    if (bookingStepIndex === 0) {
      if (!service) {
        setStatus({ type: "error", message: "Select a service to continue." });
        return;
      }
      if (!slot) {
        setStatus({ type: "error", message: "Choose a time slot before moving on." });
        return;
      }
      setBookingStepIndex(1);
      return;
    }

    // Section 2: capture student
    if (bookingStepIndex === 1) {
      if (!formState.studentId) {
        if (!formState.name || !formState.email) {
          setStatus({ type: "error", message: "Add student name and email." });
          return;
        }
      }
      setBookingStepIndex(2);
      return;
    }

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
        // Build the input for the new action
        const input: ManualBookingInput = {
          service_id: service.id,
          scheduled_at: slot.start,
          duration_minutes: service.duration_minutes,
          timezone,
          notes: formState.notes || undefined,
          payment_option: formState.paymentOption,
        };

        // Either existing student or new student
        if (formState.studentId) {
          input.student_id = formState.studentId;
        } else {
          if (!formState.name || !formState.email) {
            setStatus({ type: "error", message: "Add student name and email." });
            return;
          }
          input.new_student = {
            name: formState.name,
            email: formState.email,
            timezone: formState.studentTimezone,
          };
        }

        const result = await createManualBookingWithPaymentLink(input);

        if (result.error || !result.data) {
          setStatus({ type: "error", message: result.error ?? "Could not create booking." });
          return;
        }

        // Build success message based on payment option
        let successMessage = "Lesson scheduled!";
        if (formState.paymentOption === "send_link" && result.data.paymentUrl) {
          successMessage = "Lesson scheduled! Payment link sent to student.";
        } else if (formState.paymentOption === "already_paid") {
          successMessage = "Lesson scheduled and marked as paid.";
        } else if (formState.paymentOption === "free") {
          successMessage = "Free lesson scheduled!";
        }

        setStatus({ type: "success", message: successMessage });
        resetForm();
        setIsModalOpen(false);
        router.refresh();
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

  function handleModalChange(open: boolean) {
    setIsModalOpen(open);
    if (open) {
      setStatus(null);
    } else {
      resetForm();
    }
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
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Lesson
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
            <p className="text-xs text-muted-foreground">Click &quot;Add Booking&quot; to schedule a lesson.</p>
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

      {/* Add Booking Modal */}
          <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0 pb-6 text-left">
            <DialogTitle className="text-2xl font-semibold text-foreground">New Lesson</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Schedule a lesson and send your student the details.
            </p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <FlowProgress steps={[...BOOKING_STEPS]} activeIndex={bookingStepIndex} />
            {status?.type === "error" ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {status.message}
              </div>
            ) : null}
            <form className="space-y-4 text-sm" onSubmit={handleSubmit} id="booking-form">
              {bookingStepIndex === 0 ? (
                <div className="space-y-6">
                  <label className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Service</span>
                    <select
                      value={formState.serviceId ?? ""}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          serviceId: event.target.value || null,
                        }))
                      }
                      className="rounded-xl border-0 bg-secondary/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Price and Duration Display */}
                  {selectedService && (
                    <div className="flex items-center gap-4 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
                      <div className="flex-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Price</span>
                        <p className="text-lg font-bold text-primary">
                          {selectedService.currency.toUpperCase()} {(selectedService.price / 100).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Duration</span>
                        <p className="text-lg font-semibold text-foreground">
                          {selectedService.duration_minutes} min
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 sm:flex-row">
                    <label className="flex w-full flex-col sm:w-1/2">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Date</span>
                      <select
                        value={selectedDay}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSelectedDay(value);
                          const firstSlot = generatedSlots.find(
                            (slot) => format(new Date(slot.start), "yyyy-MM-dd") === value
                          );
                          setFormState((prev) => ({ ...prev, slot: firstSlot ?? null }));
                        }}
                        className="rounded-xl border-0 bg-secondary/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {dayOptions.length === 0 ? (
                          <option value="">No available dates</option>
                        ) : (
                          dayOptions.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))
                        )}
                      </select>
                    </label>

                    <label className="flex w-full flex-col sm:w-1/2">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Start time</span>
                      <select
                        value={formState.slot?.start ?? ""}
                        onChange={(event) => {
                          const selected = timeOptions.find((slot) => slot.start === event.target.value) ?? null;
                          setFormState((prev) => ({ ...prev, slot: selected }));
                        }}
                        className="rounded-xl border-0 bg-secondary/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        disabled={!selectedDay}
                      >
                        <option value="">{selectedDay ? "Select a time" : "Choose a date first"}</option>
                        {timeOptions.map((slot) => (
                          <option key={slot.start} value={slot.start}>
                            {slot.time_label}
                          </option>
                        ))}
                      </select>
                      {generatedSlots.length === 0 && (
                        <span className="text-xs text-destructive">
                          Add availability to generate bookable slots.
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              ) : null}

              {bookingStepIndex === 1 ? (
                <div className="space-y-4">
                  <label className="flex flex-col">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Student</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormState((prev) => ({
                            ...prev,
                            studentId: null,
                            name: "",
                            email: "",
                          }))
                        }
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition hover:bg-secondary/60"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New
                      </button>
                    </div>
                    <select
                      value={formState.studentId ?? ""}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          studentId: event.target.value || null,
                        }))
                      }
                      className="rounded-xl border-0 bg-secondary/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col">
                          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Name</span>
                          <input
                            type="text"
                            value={formState.name}
                            onChange={(event) =>
                              setFormState((prev) => ({ ...prev, name: event.target.value }))
                            }
                            className="rounded-xl border-0 bg-secondary/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </label>
                        <label className="flex flex-col">
                          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Email</span>
                          <input
                            type="email"
                            value={formState.email}
                            onChange={(event) =>
                              setFormState((prev) => ({ ...prev, email: event.target.value }))
                            }
                            className="rounded-xl border-0 bg-secondary/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </label>
                      </div>
                      <label className="flex flex-col">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Timezone</span>
                        <TimezoneSelect
                          value={formState.studentTimezone}
                          onChange={(timezoneValue) =>
                            setFormState((prev) => ({ ...prev, studentTimezone: timezoneValue }))
                          }
                        />
                      </label>
                    </div>
                  ) : selectedStudent?.timezone ? (
                    <p className="text-xs text-muted-foreground">
                      Student timezone: {selectedStudent.timezone}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {bookingStepIndex === 2 ? (
                <div className="space-y-4">
                  {/* Lesson Summary Card */}
                  <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">Lesson</span>
                      <span className="text-muted-foreground">
                        {selectedService?.name ?? "Choose a service"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">Time</span>
                      <span className="text-muted-foreground">
                        {formState.slot
                          ? `${formState.slot.day_label} · ${formState.slot.time_label}`
                          : "No time chosen"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">Student</span>
                      <span className="text-muted-foreground">
                        {selectedStudent
                          ? selectedStudent.full_name
                          : formState.name || "New student"}
                      </span>
                    </div>
                    {selectedService && (
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
                        <span className="font-semibold text-foreground">Price</span>
                        <span className="font-bold text-primary">
                          {selectedService.currency.toUpperCase()} {(selectedService.price / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Payment Options */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment</span>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-background p-3 cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="send_link"
                          checked={formState.paymentOption === "send_link"}
                          onChange={() => setFormState((prev) => ({ ...prev, paymentOption: "send_link" }))}
                          className="mt-0.5 h-4 w-4 text-primary focus:ring-primary/20"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Send payment link</p>
                          <p className="text-xs text-muted-foreground">Student receives email with payment link</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-background p-3 cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="already_paid"
                          checked={formState.paymentOption === "already_paid"}
                          onChange={() => setFormState((prev) => ({ ...prev, paymentOption: "already_paid" }))}
                          className="mt-0.5 h-4 w-4 text-primary focus:ring-primary/20"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Already paid</p>
                          <p className="text-xs text-muted-foreground">Cash, bank transfer, or other method</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-background p-3 cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="free"
                          checked={formState.paymentOption === "free"}
                          onChange={() => setFormState((prev) => ({ ...prev, paymentOption: "free" }))}
                          className="mt-0.5 h-4 w-4 text-primary focus:ring-primary/20"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Free / trial lesson</p>
                          <p className="text-xs text-muted-foreground">No payment required</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Notes */}
                  <label className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Notes (optional)</span>
                    <textarea
                      value={formState.notes}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      rows={2}
                      className="rounded-xl border-0 bg-secondary/30 px-3 py-2 text-sm leading-relaxed shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Add any notes for this lesson..."
                    />
                  </label>
                </div>
              ) : null}
            </form>
          </div>
          <div className="flex flex-wrap gap-2 px-6 py-4 shrink-0 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleModalChange(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            {bookingStepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setBookingStepIndex((prev) => Math.max(prev - 1, 0))}
                className="flex-1 sm:flex-none"
                disabled={isPending}
              >
                Back
              </Button>
            ) : null}
            <Button
              type="submit"
              form="booking-form"
              disabled={isPending}
              className="w-full h-12 rounded-full shadow-lg shadow-primary/20"
            >
              {isPending
                ? "Scheduling..."
                : bookingStepIndex === 2
                  ? "Schedule Lesson"
                  : "Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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

  const items = collapsed ? bookings.slice(0, 5) : bookings;

  return (
    <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {collapsed && bookings.length > 5 ? (
          <span className="text-xs text-muted-foreground">
            Showing {items.length} of {bookings.length}
          </span>
        ) : null}
      </div>
      <ul className="mt-3 space-y-3">
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

  const canReschedule = !isCancelled &&
    booking.status !== "completed" &&
    new Date(booking.scheduled_at) > new Date();

  return (
    <li
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
        isPaid
          ? "border-emerald-200 bg-emerald-50/50"
          : isPendingPayment
            ? "border-amber-200 bg-amber-50/50"
            : "border-border/60 bg-primary/5"
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
            className="text-xs text-primary hover:underline truncate"
          >
            Join on {booking.meeting_provider === "zoom_personal" ? "Zoom" : booking.meeting_provider === "google_meet" ? "Google Meet" : booking.meeting_provider === "custom" ? "Video Call" : "Meeting"}
          </a>
        </div>
      )}

      {/* Native Classroom Button */}
      <div className="flex items-center gap-2 pt-2 border-t border-current/10">
        {hasStudioAccess ? (
          <Link
            href={`/classroom/${booking.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition"
          >
            <Video className="h-3.5 w-3.5" />
            Join Classroom
          </Link>
        ) : (
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition"
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/90 disabled:opacity-60"
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
