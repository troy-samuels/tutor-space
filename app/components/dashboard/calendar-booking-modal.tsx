"use client";

import { useState, useEffect, useId } from "react";
import { setHours, setMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { X, Loader2, Clock, Calendar, User, BookOpen, CreditCard, FileText } from "lucide-react";
import { createBooking } from "@/lib/actions/bookings";
import { Switch } from "@/components/ui/switch";
import { useBookingPreferences } from "@/lib/hooks/useBookingPreferences";
import { useBookingForm } from "@/lib/hooks/useBookingForm";
import { useBookingSlots } from "@/lib/hooks/useBookingSlots";

type ServiceSummary = {
  id: string;
  name: string;
  duration_minutes: number;
  price_amount: number | null;
  currency: string | null;
};

type StudentSummary = {
  id: string;
  full_name: string;
  email: string;
  timezone: string | null;
};

type CalendarBookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date;
  initialHour?: number;
  services: ServiceSummary[];
  students: StudentSummary[];
  recentStudentIds?: string[];
  tutorTimezone: string;
  tutorId: string;
  mostUsedServiceId?: string;
};

export function CalendarBookingModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialHour,
  services,
  students,
  recentStudentIds = [],
  tutorTimezone,
  tutorId,
  mostUsedServiceId,
}: CalendarBookingModalProps) {
  const quickModeId = useId();

  const {
    preferences,
    isLoaded: prefsLoaded,
    saveServiceId,
    saveStudentId,
    setQuickMode,
    getSmartDefaultService,
    getSmartDefaultStudent,
  } = useBookingPreferences({ mostUsedServiceId });

  const defaultServiceId = prefsLoaded ? getSmartDefaultService(services) : "";
  const defaultStudentId = prefsLoaded
    ? getSmartDefaultStudent(students, recentStudentIds)
    : "";

  const bookingSlots = useBookingSlots({ isOpen, initialDate, initialHour });
  const bookingForm = useBookingForm({
    isOpen,
    isReady: prefsLoaded,
    tutorTimezone,
    defaultServiceId,
    defaultStudentId,
    quickModeEnabled: preferences.quickModeEnabled,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setIsSubmitting(false);
  }, [isOpen]);

  const handleQuickModeChange = (checked: boolean) => {
    bookingForm.handleQuickModeChange(checked);
    setQuickMode(checked);
  };

  const selectedService = services.find((service) => service.id === bookingForm.serviceId);
  const durationMinutes = selectedService?.duration_minutes ?? 60;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!bookingForm.serviceId) {
        setError("Please select a service");
        setIsSubmitting(false);
        return;
      }

      let finalStudentId = bookingForm.studentId;
      if (bookingForm.showNewStudent) {
        if (!bookingForm.newStudentName.trim() || !bookingForm.newStudentEmail.trim()) {
          setError("Please enter student name and email");
          setIsSubmitting(false);
          return;
        }
        const { ensureStudent } = await import("@/lib/actions/students");
        const normalizedEmail = bookingForm.newStudentEmail.trim().toLowerCase();
        const clientMutationId = `idempotency-student-${tutorId}-${normalizedEmail}`;
        const studentResult = await ensureStudent({
          full_name: bookingForm.newStudentName.trim(),
          email: normalizedEmail,
          timezone: bookingForm.newStudentTimezone,
          clientMutationId,
        });
        if (studentResult.error) {
          setError(studentResult.error);
          setIsSubmitting(false);
          return;
        }
        finalStudentId = studentResult.data!.id;
      }

      if (!finalStudentId) {
        setError("Please select or create a student");
        setIsSubmitting(false);
        return;
      }

      if (!bookingSlots.date || !bookingSlots.startTime) {
        setError("Please choose a date and start time");
        setIsSubmitting(false);
        return;
      }

      let startDateTime: Date;
      try {
        startDateTime = fromZonedTime(`${bookingSlots.date}T${bookingSlots.startTime}:00`, tutorTimezone);
      } catch {
        const [startHour, startMinute] = bookingSlots.startTime.split(":").map(Number);
        startDateTime = setMinutes(setHours(new Date(bookingSlots.date), startHour), startMinute);
      }

      const result = await createBooking({
        service_id: bookingForm.serviceId,
        student_id: finalStudentId,
        scheduled_at: startDateTime.toISOString(),
        duration_minutes: durationMinutes,
        timezone: tutorTimezone,
        notes: bookingForm.notes || undefined,
        skipAdvanceBookingCheck: true,
      });

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      if (bookingForm.paymentStatus === "unpaid" && result.data) {
        const { sendPaymentRequestForBooking } = await import("@/lib/actions/bookings");
        sendPaymentRequestForBooking(result.data.id).catch((err) => {
          console.error("Failed to send payment request email:", err);
        });
      }

      if (bookingForm.paymentStatus === "paid" && result.data) {
        const { markBookingAsPaid } = await import("@/lib/actions/bookings");
        await markBookingAsPaid(result.data.id);
      }

      saveServiceId(bookingForm.serviceId);
      saveStudentId(finalStudentId);

      onSuccess();
      onClose();
      bookingForm.resetForm();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = ["Service & student", "Schedule & payment", "Notes"];
  const canProceedFromStep = () => {
    const hasStudent = bookingForm.showNewStudent
      ? Boolean(bookingForm.newStudentName.trim() && bookingForm.newStudentEmail.trim())
      : Boolean(bookingForm.studentId);
    if (bookingForm.step === 0) return Boolean(bookingForm.serviceId && hasStudent);
    if (bookingForm.step === 1) return Boolean(bookingSlots.date && bookingSlots.startTime);
    return true;
  };

  const showServiceAndStudent = bookingForm.isQuickMode || bookingForm.step === 0;
  const showScheduleAndPayment = bookingForm.isQuickMode || bookingForm.step === 1;
  const showNotes = bookingForm.isQuickMode || bookingForm.step === 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-border/50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create Booking</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <label htmlFor={quickModeId} className="text-sm font-medium text-foreground">
                Quick mode
              </label>
              <p className="text-xs text-muted-foreground">
                Show all fields in one scrollable form.
              </p>
            </div>
            <Switch id={quickModeId} checked={bookingForm.isQuickMode} onCheckedChange={handleQuickModeChange} />
          </div>
          {!bookingForm.isQuickMode ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Step {bookingForm.step + 1} of {stepLabels.length}: {stepLabels[bookingForm.step]}
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Selection */}
          {showServiceAndStudent ? (
            <>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  <BookOpen className="inline h-4 w-4 mr-1" />
                  Service
                </label>
                <select
                  value={bookingForm.serviceId}
                  onChange={(e) => bookingForm.setServiceId(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  autoFocus
                >
                  <option value="">Select a service...</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.duration_minutes} min
                      {service.price_amount
                        ? ` - ${(service.price_amount / 100).toFixed(2)} ${service.currency || "USD"}`
                        : ""})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Student
                </label>
                {!bookingForm.showNewStudent ? (
                  <div className="space-y-2">
                    {recentStudentIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="text-xs text-muted-foreground mr-1">Recent:</span>
                        {recentStudentIds.slice(0, 4).map((id) => {
                          const student = students.find((s) => s.id === id);
                          if (!student) return null;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => bookingForm.setStudentId(id)}
                              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                bookingForm.studentId === id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                            >
                              {student.full_name.split(" ")[0]}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <select
                      value={bookingForm.studentId}
                      onChange={(e) => bookingForm.setStudentId(e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select a student...</option>
                      {recentStudentIds.length > 0 && (
                        <optgroup label="Recent">
                          {recentStudentIds.map((id) => {
                            const student = students.find((s) => s.id === id);
                            if (!student) return null;
                            return (
                              <option key={`recent-${id}`} value={id}>
                                {student.full_name} ({student.email})
                              </option>
                            );
                          })}
                        </optgroup>
                      )}
                      <optgroup label={recentStudentIds.length > 0 ? "All Students" : "Students"}>
                        {students
                          .filter((s) => !recentStudentIds.includes(s.id))
                          .map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.full_name} ({student.email})
                            </option>
                          ))}
                      </optgroup>
                    </select>
                    <button
                      type="button"
                      onClick={() => bookingForm.setShowNewStudent(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      + Add new student
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">New Student</span>
                      <button
                        type="button"
                        onClick={bookingForm.resetNewStudent}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                    <input
                      type="text"
                      value={bookingForm.newStudentName}
                      onChange={(e) => bookingForm.setNewStudentName(e.target.value)}
                      placeholder="Full name"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="email"
                      value={bookingForm.newStudentEmail}
                      onChange={(e) => bookingForm.setNewStudentEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <select
                      value={bookingForm.newStudentTimezone}
                      onChange={(e) => bookingForm.setNewStudentTimezone(e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value={tutorTimezone}>{tutorTimezone} (Your timezone)</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                      <option value="America/Chicago">America/Chicago</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="Europe/Berlin">Europe/Berlin</option>
                      <option value="Asia/Tokyo">Asia/Tokyo</option>
                      <option value="Asia/Shanghai">Asia/Shanghai</option>
                      <option value="Asia/Seoul">Asia/Seoul</option>
                      <option value="Australia/Sydney">Australia/Sydney</option>
                    </select>
                  </div>
                )}
              </div>
            </>
          ) : null}

          {showScheduleAndPayment ? (
            <>
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={bookingSlots.date}
                    onChange={(e) => bookingSlots.setDate(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={bookingSlots.startTime}
                    onChange={(e) => bookingSlots.setStartTime(e.target.value)}
                    step={900}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              {selectedService && (
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  Duration: {durationMinutes} min (ends at {bookingSlots.getEndTime(durationMinutes)})
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  <CreditCard className="inline h-4 w-4 mr-1" />
                  Payment Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => bookingForm.setPaymentStatus("unpaid")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      bookingForm.paymentStatus === "unpaid"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    Unpaid
                  </button>
                  <button
                    type="button"
                    onClick={() => bookingForm.setPaymentStatus("paid")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      bookingForm.paymentStatus === "paid"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    Paid
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {showNotes ? (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                <FileText className="inline h-4 w-4 mr-1" />
                Notes (optional)
              </label>
              <textarea
                value={bookingForm.notes}
                onChange={(e) => bookingForm.setNotes(e.target.value)}
                placeholder="Any notes about this booking..."
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          ) : null}

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            {!bookingForm.isQuickMode && bookingForm.step > 0 ? (
              <button
                type="button"
                onClick={() => bookingForm.setStep((prev) => Math.max(0, prev - 1))}
                className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                disabled={isSubmitting}
              >
                Back
              </button>
            ) : null}
            {!bookingForm.isQuickMode && bookingForm.step < 2 ? (
              <button
                type="button"
                onClick={() => bookingForm.setStep((prev) => Math.min(2, prev + 1))}
                disabled={isSubmitting || !canProceedFromStep()}
                className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Booking"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
