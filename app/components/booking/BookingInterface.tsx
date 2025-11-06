"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { BookableSlot } from "@/lib/utils/slots";
import type { StudentLessonHistoryData } from "@/lib/actions/student-lessons";
import StudentInfoForm from "./StudentInfoForm";
import { StudentLessonHistory } from "./StudentLessonHistory";
import Image from "next/image";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: number;
  price_currency: string;
  is_active: boolean;
}

interface Tutor {
  id: string;
  fullName: string;
  username: string;
  email: string;
  bio: string;
  avatarUrl: string;
  instagramHandle: string;
  websiteUrl: string;
  timezone: string;
}

interface GroupedSlots {
  date: string;
  dateFormatted: string;
  slots: BookableSlot[];
}

interface BookingInterfaceProps {
  tutor: Tutor;
  services: Service[];
  selectedService: Service;
  groupedSlots: GroupedSlots[];
  lessonHistory?: StudentLessonHistoryData | null;
}

export default function BookingInterface({
  tutor,
  services,
  selectedService: initialService,
  groupedSlots,
  lessonHistory,
}: BookingInterfaceProps) {
  const [selectedService, setSelectedService] = useState(initialService);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);

  const handleSlotSelect = (slot: BookableSlot) => {
    setSelectedSlot(slot);
    setShowStudentForm(true);
  };

  const handleBack = () => {
    setShowStudentForm(false);
    setSelectedSlot(null);
  };

  const formatSlotTime = (slot: BookableSlot) => {
    const zonedStart = toZonedTime(slot.start, tutor.timezone);
    const zonedEnd = toZonedTime(slot.end, tutor.timezone);
    return `${format(zonedStart, "h:mm a")} - ${format(zonedEnd, "h:mm a")}`;
  };

  if (showStudentForm && selectedSlot) {
    return (
      <StudentInfoForm
        tutor={tutor}
        service={selectedService}
        selectedSlot={selectedSlot}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {/* Header with Tutor Info */}
      <div className="mb-8 text-center">
        <div className="flex flex-col items-center gap-4 mb-4">
          {tutor.avatarUrl && (
            <Image
              src={tutor.avatarUrl}
              alt={tutor.fullName}
              width={80}
              height={80}
              className="rounded-full"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Book a lesson with {tutor.fullName}
            </h1>
            {tutor.bio && (
              <p className="mt-2 text-gray-600 max-w-2xl mx-auto">{tutor.bio}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content - Slots */}
        <div className="md:col-span-2 space-y-6">
          {/* Student Lesson History */}
          {lessonHistory && (
            <StudentLessonHistory data={lessonHistory} tutorName={tutor.fullName} />
          )}

          {/* Service Selection */}
          {services.length > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Select a Service</h2>
              <div className="grid gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedService.id === service.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {service.duration_minutes} minutes
                        </p>
                        {service.description && (
                          <p className="text-sm text-gray-500 mt-2">
                            {service.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {service.price_currency.toUpperCase()}{" "}
                          {service.price_amount}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Available Slots */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">
              Available Times
              <span className="text-sm text-gray-500 font-normal ml-2">
                ({tutor.timezone})
              </span>
            </h2>

            {groupedSlots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No availability in the next 14 days. Please contact{" "}
                  {tutor.fullName} directly to schedule a lesson.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedSlots.map((group) => (
                  <div key={group.date}>
                    <h3 className="font-medium text-gray-900 mb-3">
                      {group.dateFormatted}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {group.slots.map((slot) => (
                        <button
                          key={slot.startISO}
                          onClick={() => handleSlotSelect(slot)}
                          className="px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                          {formatSlotTime(slot)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Service Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
            <h3 className="font-semibold text-lg mb-4">Lesson Details</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-medium">{selectedService.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium">{selectedService.duration_minutes} minutes</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-medium text-lg">
                  {selectedService.price_currency.toUpperCase()}{" "}
                  {selectedService.price_amount}
                </p>
              </div>

              {selectedService.description && (
                <div>
                  <p className="text-sm text-gray-600">About</p>
                  <p className="text-sm mt-1">{selectedService.description}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-sm mb-2">How it works</h4>
              <ol className="text-sm text-gray-600 space-y-2">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Select a time slot</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Enter your information</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>Complete payment</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>Receive confirmation email</span>
                </li>
              </ol>
            </div>

            {(tutor.instagramHandle || tutor.websiteUrl) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-sm mb-3">Need help?</h4>
                <div className="space-y-2">
                  {tutor.instagramHandle && (
                    <a
                      href={`https://instagram.com/${tutor.instagramHandle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block"
                    >
                      Message on Instagram
                    </a>
                  )}
                  {tutor.websiteUrl && (
                    <a
                      href={tutor.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block"
                    >
                      Visit website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
