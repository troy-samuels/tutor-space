"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { CalendarX, Loader2, Search, Package, CreditCard, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getTutorBookingDetails,
  getAvailableSlots,
  createStudentBooking,
  type TutorBookingDetails,
  type StudentPackage,
  type GroupedSlots,
} from "@/lib/actions/student-bookings";
import type { TutorSearchResult, TutorWithDetails } from "@/lib/actions/student-connections";
import { ServiceCard } from "./ServiceCard";
import { TimeSlotSelector } from "./TimeSlotSelector";
import { BookingConfirmationSheet } from "./BookingConfirmationSheet";

type StudentBookingPageProps = {
  tutors: TutorSearchResult[];
  tutorsError?: string;
};

type SelectedService = TutorWithDetails["services"][number] | null;

type PaymentMethod = "subscription" | "package" | "direct";

export function StudentBookingPage({ tutors, tutorsError }: StudentBookingPageProps) {
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [tutorDetails, setTutorDetails] = useState<TutorBookingDetails | null>(null);
  const [availableSlots, setAvailableSlots] = useState<GroupedSlots | null>(null);
  const [timezone, setTimezone] = useState<string>("UTC");
  const [selectedService, setSelectedService] = useState<SelectedService>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Auto-select tutor if only one
  useEffect(() => {
    if (tutors.length === 1 && !selectedTutorId) {
      handleTutorSelect(tutors[0].id);
    }
  }, [tutors]);

  const handleTutorSelect = (tutorId: string) => {
    setSelectedTutorId(tutorId);
    setSelectedService(null);
    setSelectedSlot(null);
    setAvailableSlots(null);
    setError(null);

    startTransition(async () => {
      const result = await getTutorBookingDetails(tutorId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) {
        setTutorDetails(result.data);
      }
    });
  };

  const handleServiceSelect = (service: SelectedService) => {
    if (!service || !selectedTutorId) return;

    setSelectedService(service);
    setSelectedSlot(null);
    setError(null);

    startTransition(async () => {
      const result = await getAvailableSlots(selectedTutorId, service.duration_minutes);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) {
        setAvailableSlots(result.data);
        setTimezone(result.timezone || "UTC");
      }
    });
  };

  const handleSlotSelect = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
    setShowConfirmation(true);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if student can use credits for the selected service
  const canUsePackage = (service: SelectedService): StudentPackage | null => {
    if (!service || !tutorDetails?.packages) return null;
    return tutorDetails.packages.find(
      (pkg) => pkg.remaining_minutes >= service.duration_minutes
    ) || null;
  };

  const canUseSubscription = (): boolean => {
    if (!tutorDetails?.subscription) return false;
    return tutorDetails.subscription.lessonsAvailable > 0;
  };

  const selectedTutor = tutors.find((t) => t.id === selectedTutorId);

  // Empty state - no approved tutors
  if (tutors.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <CalendarX className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">No Tutors Connected</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Connect with tutors to start booking lessons directly.
        </p>
        <Link
          href="/student/search"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
        >
          <Search className="h-4 w-4" />
          Find Tutors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Book a Lesson</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a tutor, service, and time slot
        </p>
      </div>

      {/* Error state */}
      {(error || tutorsError) && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || tutorsError}
        </div>
      )}

      {/* Tutor selector */}
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Select a Tutor
        </label>
        <Select
          value={selectedTutorId || ""}
          onValueChange={handleTutorSelect}
          disabled={isPending}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a tutor to book with..." />
          </SelectTrigger>
          <SelectContent>
            {tutors.map((tutor) => (
              <SelectItem key={tutor.id} value={tutor.id}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={tutor.avatar_url || undefined} alt={tutor.full_name || "Tutor"} />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {getInitials(tutor.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{tutor.full_name || tutor.username}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {isPending && !tutorDetails && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Credits banner */}
      {tutorDetails && (
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium text-foreground mb-3">Your Credits</h3>
          <div className="flex flex-wrap gap-3">
            {/* Packages */}
            {tutorDetails.packages.length > 0 ? (
              tutorDetails.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm"
                >
                  <Package className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-800 font-medium">
                    {pkg.remaining_minutes} min
                  </span>
                  <span className="text-emerald-600 text-xs">{pkg.name}</span>
                </div>
              ))
            ) : null}

            {/* Subscription */}
            {tutorDetails.subscription && tutorDetails.subscription.status === "active" ? (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  {tutorDetails.subscription.lessonsAvailable} lesson
                  {tutorDetails.subscription.lessonsAvailable !== 1 ? "s" : ""}
                </span>
                <span className="text-blue-600 text-xs">subscription</span>
              </div>
            ) : null}

            {/* No credits */}
            {tutorDetails.packages.length === 0 &&
              (!tutorDetails.subscription || tutorDetails.subscription.lessonsAvailable === 0) && (
                <p className="text-sm text-muted-foreground">
                  No active credits. You can pay directly when booking.
                </p>
              )}
          </div>
        </div>
      )}

      {/* Services grid */}
      {tutorDetails && tutorDetails.tutor.services.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Select a Service</h3>
          <div className="grid gap-3">
            {tutorDetails.tutor.services
              .filter((s) => s.is_active)
              .map((service) => {
                const pkg = canUsePackage(service);
                const hasSub = canUseSubscription();
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedService?.id === service.id}
                    onSelect={() => handleServiceSelect(service)}
                    hasPackageCredit={!!pkg}
                    hasSubscriptionCredit={hasSub}
                    disabled={isPending}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* No services state */}
      {tutorDetails && tutorDetails.tutor.services.filter((s) => s.is_active).length === 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
          <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            This tutor hasn&apos;t set up any services yet.
          </p>
        </div>
      )}

      {/* Time slot selector */}
      {selectedService && availableSlots && (
        <TimeSlotSelector
          slots={availableSlots}
          selectedSlot={selectedSlot}
          onSelectSlot={handleSlotSelect}
          timezone={timezone}
          isLoading={isPending}
        />
      )}

      {/* Loading slots */}
      {selectedService && isPending && !availableSlots && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading available times...</span>
        </div>
      )}

      {/* Confirmation sheet */}
      {selectedTutor && selectedService && selectedSlot && (
        <BookingConfirmationSheet
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          tutor={selectedTutor}
          service={selectedService}
          slot={selectedSlot}
          timezone={timezone}
          packages={tutorDetails?.packages || []}
          subscription={tutorDetails?.subscription || null}
        />
      )}
    </div>
  );
}
