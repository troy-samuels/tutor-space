"use client";

import { useState, useEffect } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { X, Loader2, Clock, Calendar, User, BookOpen, CreditCard, FileText } from "lucide-react";
import { createBooking } from "@/lib/actions/bookings";

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
}: CalendarBookingModalProps) {
  const defaultDate = initialDate || new Date();
  const defaultHour = initialHour ?? 9;

  const [date, setDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(
    `${String(defaultHour).padStart(2, "0")}:00`
  );
  const [serviceId, setServiceId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid">("unpaid");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New student inline creation
  const [showNewStudent, setShowNewStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentTimezone, setNewStudentTimezone] = useState(tutorTimezone);

  // Reset form when modal opens with new date/time
  useEffect(() => {
    if (isOpen) {
      setDate(format(initialDate || new Date(), "yyyy-MM-dd"));
      setStartTime(`${String(initialHour ?? 9).padStart(2, "0")}:00`);
      setError(null);
      setShowNewStudent(false);
      setNewStudentName("");
      setNewStudentEmail("");
      setNewStudentTimezone(tutorTimezone);
    }
  }, [isOpen, initialDate, initialHour, tutorTimezone]);

  // Get selected service details
  const selectedService = services.find((s) => s.id === serviceId);
  const durationMinutes = selectedService?.duration_minutes ?? 60;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!serviceId) {
        setError("Please select a service");
        setIsSubmitting(false);
        return;
      }

      // Handle new student creation if needed
      let finalStudentId = studentId;
      if (showNewStudent) {
        if (!newStudentName.trim() || !newStudentEmail.trim()) {
          setError("Please enter student name and email");
          setIsSubmitting(false);
          return;
        }
        // Import ensureStudent dynamically
        const { ensureStudent } = await import("@/lib/actions/students");
        const normalizedEmail = newStudentEmail.trim().toLowerCase();
        const clientMutationId = `idempotency-student-${tutorId}-${normalizedEmail}`;
        const studentResult = await ensureStudent({
          full_name: newStudentName.trim(),
          email: normalizedEmail,
          timezone: newStudentTimezone,
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

      // Combine date and time
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const startDateTime = setMinutes(
        setHours(new Date(date), startHour),
        startMinute
      );

      const result = await createBooking({
        service_id: serviceId,
        student_id: finalStudentId,
        scheduled_at: startDateTime.toISOString(),
        duration_minutes: durationMinutes,
        timezone: tutorTimezone,
        notes: notes || undefined,
        skipAdvanceBookingCheck: true, // Tutors can book any time without advance notice restriction
      });

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // If marked as unpaid, send payment request email to student
      if (paymentStatus === "unpaid" && result.data) {
        const { sendPaymentRequestForBooking } = await import("@/lib/actions/bookings");
        // Fire and forget - don't block UI for email sending
        sendPaymentRequestForBooking(result.data.id).catch((err) => {
          console.error("Failed to send payment request email:", err);
        });
      }

      // If marked as paid, update payment status
      if (paymentStatus === "paid" && result.data) {
        const { markBookingAsPaid } = await import("@/lib/actions/bookings");
        await markBookingAsPaid(result.data.id);
      }

      onSuccess();
      onClose();

      // Reset form
      setServiceId("");
      setStudentId("");
      setNotes("");
      setPaymentStatus("unpaid");
      setShowNewStudent(false);
      setNewStudentName("");
      setNewStudentEmail("");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate end time for display
  const getEndTime = () => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startDate = setMinutes(setHours(new Date(), startHour), startMinute);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return format(endDate, "HH:mm");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              <BookOpen className="inline h-4 w-4 mr-1" />
              Service
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
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

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step={900} // 15-minute steps
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Duration Display */}
          {selectedService && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Duration: {durationMinutes} min (ends at {getEndTime()})
            </div>
          )}

          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              <User className="inline h-4 w-4 mr-1" />
              Student
            </label>
            {!showNewStudent ? (
              <div className="space-y-2">
                {/* Recent Students Quick Pick */}
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
                          onClick={() => setStudentId(id)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            studentId === id
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
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
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
                  onClick={() => setShowNewStudent(true)}
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
                    onClick={() => {
                      setShowNewStudent(false);
                      setNewStudentName("");
                      setNewStudentEmail("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <select
                  value={newStudentTimezone}
                  onChange={(e) => setNewStudentTimezone(e.target.value)}
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

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              <CreditCard className="inline h-4 w-4 mr-1" />
              Payment Status
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus("unpaid")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  paymentStatus === "unpaid"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                Unpaid
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus("paid")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  paymentStatus === "paid"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-border hover:bg-muted"
                }`}
              >
                Paid
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              <FileText className="inline h-4 w-4 mr-1" />
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this booking..."
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              disabled={isSubmitting}
            >
              Cancel
            </button>
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
          </div>
        </form>
      </div>
    </div>
  );
}
