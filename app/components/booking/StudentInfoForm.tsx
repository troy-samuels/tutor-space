"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useRouter } from "next/navigation";
import type { BookableSlot } from "@/lib/utils/slots";
import { createBookingAndCheckout } from "@/lib/actions/bookings";

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
}

export default function StudentInfoForm({
  tutor,
  service,
  selectedSlot,
  onBack,
}: StudentInfoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    studentPhone: "",
    isMinor: false,
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    notes: "",
  });

  const zonedStart = toZonedTime(selectedSlot.start, tutor.timezone);
  const zonedEnd = toZonedTime(selectedSlot.end, tutor.timezone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.studentName || !formData.studentEmail) {
      setError("Please provide student name and email");
      return;
    }

    if (formData.isMinor && (!formData.parentName || !formData.parentEmail)) {
      setError("Please provide parent/guardian information for minor students");
      return;
    }

    startTransition(async () => {
      try {
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
            parentName: formData.isMinor ? formData.parentName : null,
            parentEmail: formData.isMinor ? formData.parentEmail : null,
            parentPhone: formData.isMinor ? formData.parentPhone : null,
          },
          notes: formData.notes || null,
          amount: service.price_amount,
          currency: service.price_currency,
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        if (result.bookingId) {
          // Redirect to success page with booking ID
          router.push(`/book/success?booking_id=${result.bookingId}`);
        }
      } catch (err) {
        console.error("Booking error:", err);
        setError("An error occurred. Please try again.");
      }
    });
  };

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
          <p className="text-sm text-gray-600 mt-2">
            Price: {service.price_currency.toUpperCase()} {service.price_amount}
          </p>
        </div>

        {/* Student Information Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Student Information</h2>

            <div className="space-y-4">
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
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Creating Booking..." : "Confirm Booking"}
          </button>

          <p className="text-xs text-gray-500 text-center">
            After booking, you&apos;ll receive payment instructions from your tutor.
            Your lesson will be confirmed once payment is received.
          </p>
        </form>
      </div>
    </div>
  );
}
