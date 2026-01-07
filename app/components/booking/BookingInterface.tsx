"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { AnimatePresence, motion } from "framer-motion";
import type { BookableSlot } from "@/lib/utils/slots";
import type { StudentLessonHistoryData } from "@/lib/actions/types";
import StudentInfoForm from "./StudentInfoForm";
import { StudentLessonHistory } from "./StudentLessonHistory";
import Image from "next/image";
import { cn, formatCurrency } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: number;
  price_currency: string;
  is_active: boolean;
}

const steps = [
  { id: "pick", label: "Pick time" },
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
] as const;

function BookingSteps({ activeIndex }: { activeIndex: number }) {
  const total = steps.length;
  const progress = Math.min(((activeIndex + 1) / total) * 100, 100);

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-600">
        <span>
          Step {Math.min(activeIndex + 1, total)} of {total}
        </span>
        <span className="text-gray-500">{steps[activeIndex]?.label ?? "Booking"}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;
          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                isActive
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : isDone
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-500"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border",
                  isDone ? "bg-emerald-500 text-white border-emerald-500" : "border-gray-300 text-gray-600"
                )}
              >
                {index + 1}
              </span>
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
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

interface SubscriptionCredit {
  id: string;
  lessonsAvailable: number;
  lessonsTotal: number;
  periodEndsAt: string;
  serviceName: string;
}

interface BookingInterfaceProps {
  tutor: Tutor;
  services: Service[];
  selectedService: Service;
  groupedSlots: GroupedSlots[];
  lessonHistory?: StudentLessonHistoryData | null;
  variant?: "page" | "inline";
  activeSubscription?: SubscriptionCredit | null;
}

export default function BookingInterface({
  tutor,
  services,
  selectedService: initialService,
  groupedSlots,
  lessonHistory,
  variant = "page",
  activeSubscription,
}: BookingInterfaceProps) {
  const [selectedService, setSelectedService] = useState(initialService);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [activeDate, setActiveDate] = useState(groupedSlots[0]?.date ?? "");

  const paymentMethodLabel =
    activeSubscription && activeSubscription.lessonsAvailable > 0
      ? `${activeSubscription.lessonsAvailable} subscription credits available`
      : "Secure checkout after confirm";
  const subscriptionChip =
    activeSubscription && activeSubscription.lessonsAvailable > 0 ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        {activeSubscription.lessonsAvailable} credits
      </span>
    ) : null;

  const handleSlotSelect = (slot: BookableSlot) => {
    setSelectedSlot(slot);
    setShowStudentForm(true);
  };

  const handleBack = () => {
    setShowStudentForm(false);
    setSelectedSlot(null);
  };

  const activeGroup = groupedSlots.find((group) => group.date === activeDate) || groupedSlots[0];
  const priceCurrency = selectedService.price_currency?.toUpperCase?.() || selectedService.price_currency;
  const priceDisplay = formatCurrency(selectedService.price_amount, priceCurrency);
  const durationDisplay = `${selectedService.duration_minutes} minutes`;

  const formatSlotTime = (slot: BookableSlot) => {
    const zonedStart = toZonedTime(slot.start, tutor.timezone);
    const zonedEnd = toZonedTime(slot.end, tutor.timezone);
    return `${format(zonedStart, "h:mm a")} - ${format(zonedEnd, "h:mm a")}`;
  };

  if (showStudentForm && selectedSlot) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10 space-y-4">
        <BookingSteps activeIndex={1} />
        <StudentInfoForm
          tutor={tutor}
          service={selectedService}
          selectedSlot={selectedSlot}
          onBack={handleBack}
          activeSubscription={activeSubscription}
        />
      </div>
    );
  }

  return (
    <div
      className={`mx-auto px-4 py-6 md:py-10 ${
        variant === "inline" ? "max-w-2xl" : "max-w-6xl"
      }`}
    >
      <BookingSteps activeIndex={0} />

      {/* Header with Tutor Info */}
      <div className="mb-6 text-center md:mb-10">
        <div className="flex flex-col items-center gap-3 md:gap-4">
          {tutor.avatarUrl && (
            <Image
              src={tutor.avatarUrl}
              alt={tutor.fullName}
              width={80}
              height={80}
              className="rounded-full"
            />
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Book a lesson with {tutor.fullName}
            </h1>
            {tutor.bio && (
              <p className="mx-auto max-w-2xl text-sm text-gray-600 md:text-base">{tutor.bio}</p>
            )}
            {subscriptionChip}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:gap-8">
        {/* Lesson summary card (mobile-first) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Service</p>
              <p className="text-sm font-semibold text-gray-900">{selectedService.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Price</p>
              <p className="text-lg font-semibold text-gray-900">{priceDisplay}</p>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">{durationDisplay}</p>
          <div className="mt-3 space-y-1 text-xs text-gray-700">
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
            <p className="pt-1 text-[11px] text-gray-500">Payment: {paymentMethodLabel}</p>
          </div>
        </div>

        {/* Student Lesson History */}
        {lessonHistory && (
          <StudentLessonHistory
            data={lessonHistory}
            tutorName={tutor.fullName}
            tutorTimezone={tutor.timezone}
          />
        )}

        {/* Service Selection */}
        {services.length > 1 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Select a service</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Tap to switch
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setSelectedSlot(null);
                  }}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    selectedService.id === service.id
                      ? "border-blue-600 bg-blue-50/60 shadow-sm"
                      : "border-gray-200 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-xs text-gray-500">{service.duration_minutes} minutes</p>
                      {service.description && (
                        <p className="text-sm text-gray-600">{service.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-gray-900">
                        {formatCurrency(service.price_amount, service.price_currency)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Available Slots */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Available times</h2>
              <p className="text-sm text-gray-500">{tutor.timezone}</p>
            </div>
          </div>

          {groupedSlots.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-600">
                No availability in the next 14 days. Please contact {tutor.fullName} directly to schedule
                a lesson.
              </p>
            </div>
          ) : (
            <>
              <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto pb-2 px-1">
                {groupedSlots.map((group) => {
                  const date = parseISO(group.date);
                  const label = format(date, "EEE");
                  const day = format(date, "d");
                  const month = format(date, "MMM");
                  const isActive = group.date === activeGroup?.date;
                  return (
                    <button
                      key={group.date}
                      onClick={() => setActiveDate(group.date)}
                      className={cn(
                        "flex min-w-[88px] flex-col items-center gap-0.5 rounded-full border px-4 py-3 text-center text-sm font-semibold transition-all",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-white text-foreground hover:border-primary/50"
                      )}
                    >
                      <span className="text-[11px] uppercase tracking-wide">{label}</span>
                      <span className="text-base font-bold">{day}</span>
                      <span className="text-[11px] text-muted-foreground">{month}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {activeGroup ? (
                  <motion.div
                    key={activeGroup.date}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mt-5 space-y-3"
                  >
                    <div className="text-sm font-semibold text-gray-900">{activeGroup.dateFormatted}</div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {activeGroup.slots.map((slot) => (
                        <button
                          key={slot.startISO}
                          onClick={() => handleSlotSelect(slot)}
                          className="w-full rounded-2xl border-2 border-gray-200 px-4 py-4 text-base font-semibold text-gray-900 transition hover:border-primary hover:text-primary sm:w-1/2 lg:w-1/3"
                        >
                          <span className="block text-center">{formatSlotTime(slot)}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Sidebar - Service Details (desktop) */}
        <div className="hidden md:block">
          <div className="sticky top-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Lesson details</h3>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Service</p>
                <p className="font-semibold text-gray-900">{selectedService.name}</p>
              </div>

              <div>
                <p className="text-gray-500">Duration</p>
                <p className="font-semibold text-gray-900">{durationDisplay}</p>
              </div>

              <div>
                <p className="text-gray-500">Price</p>
                <p className="text-lg font-semibold text-gray-900">{priceDisplay}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm space-y-1">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Lesson</span>
                  <span>{priceDisplay}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Fees</span>
                  <span>$0</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{priceDisplay}</span>
                </div>
                <p className="text-xs text-gray-500">Payment: {paymentMethodLabel}</p>
              </div>

              {selectedService.description && (
                <div>
                  <p className="text-gray-500">About</p>
                  <p className="mt-1 text-gray-700">{selectedService.description}</p>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-900">How it works</h4>
              <ol className="space-y-2 text-sm text-gray-600">
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
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">Need help?</h4>
                <div className="space-y-2">
                  {tutor.instagramHandle && (
                    <a
                      href={`https://instagram.com/${tutor.instagramHandle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-semibold text-blue-600 hover:underline"
                    >
                      Message on Instagram
                    </a>
                  )}
                  {tutor.websiteUrl && (
                    <a
                      href={tutor.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-semibold text-blue-600 hover:underline"
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
