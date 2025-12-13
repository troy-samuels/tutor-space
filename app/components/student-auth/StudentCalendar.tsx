"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format, addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Calendar, ChevronDown, Clock, Loader2, Search, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getApprovedTutors,
  getTutorForBooking,
  getTutorBookings,
  type TutorSearchResult,
  type TutorWithDetails,
} from "@/lib/actions/student-connections";
import { generateBookableSlots, groupSlotsByDate, filterFutureSlots, type BookableSlot } from "@/lib/utils/slots";
import { StudentBookingForm } from "./StudentBookingForm";
import { formatCurrency } from "@/lib/utils";

export function StudentCalendar() {
  const [tutors, setTutors] = useState<TutorSearchResult[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [tutorDetails, setTutorDetails] = useState<TutorWithDetails | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [groupedSlots, setGroupedSlots] = useState<{ date: string; dateFormatted: string; slots: BookableSlot[] }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);

  const [loadingTutors, setLoadingTutors] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Load approved tutors on mount
  useEffect(() => {
    async function loadTutors() {
      const result = await getApprovedTutors();
      if (result.tutors) {
        setTutors(result.tutors);
        // Auto-select first tutor if available
        if (result.tutors.length === 1) {
          setSelectedTutorId(result.tutors[0].id);
        }
      }
      setLoadingTutors(false);
    }
    loadTutors();
  }, []);

  // Load tutor details when selected
  const loadTutorDetails = useCallback(async (tutorId: string) => {
    setLoadingDetails(true);
    setError("");
    setTutorDetails(null);
    setSelectedServiceId(null);
    setGroupedSlots([]);
    setSelectedSlot(null);

    try {
      const [detailsResult, bookingsResult] = await Promise.all([
        getTutorForBooking(tutorId),
        getTutorBookings(tutorId),
      ]);

      if (detailsResult.error) {
        setError(detailsResult.error);
        setLoadingDetails(false);
        return;
      }

      if (detailsResult.tutor) {
        setTutorDetails(detailsResult.tutor);

        // Auto-select first service
        if (detailsResult.tutor.services.length > 0) {
          const firstService = detailsResult.tutor.services[0];
          setSelectedServiceId(firstService.id);

          // Generate slots for this service
          generateSlots(
            detailsResult.tutor,
            firstService.duration_minutes,
            bookingsResult.bookings || []
          );
        }
      }
    } catch {
      setError("Failed to load tutor information");
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTutorId) {
      loadTutorDetails(selectedTutorId);
    }
  }, [selectedTutorId, loadTutorDetails]);

  // Generate slots when service changes
  const handleServiceChange = async (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedSlot(null);

    if (!tutorDetails) return;

    const service = tutorDetails.services.find((s) => s.id === serviceId);
    if (!service) return;

    const bookingsResult = await getTutorBookings(tutorDetails.id);
    generateSlots(tutorDetails, service.duration_minutes, bookingsResult.bookings || []);
  };

  const generateSlots = (
    tutor: TutorWithDetails,
    durationMinutes: number,
    existingBookings: { scheduled_at: string; duration_minutes: number; status: string }[]
  ) => {
    const startDate = new Date();
    const endDate = addDays(startDate, 14); // Show 2 weeks

    const slots = generateBookableSlots({
      availability: tutor.availability,
      startDate,
      endDate,
      slotDuration: durationMinutes,
      timezone: tutor.timezone,
      existingBookings,
    });

    const futureSlots = filterFutureSlots(slots);
    const grouped = groupSlotsByDate(futureSlots, tutor.timezone);
    setGroupedSlots(grouped);
  };

  const handleSlotSelect = (slot: BookableSlot) => {
    setSelectedSlot(slot);
  };

  const handleBookingBack = () => {
    setSelectedSlot(null);
  };

  const handleBookingSuccess = () => {
    // Refresh slots after booking
    if (selectedTutorId) {
      loadTutorDetails(selectedTutorId);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatSlotTime = (slot: BookableSlot) => {
    if (!tutorDetails) return "";
    const zonedStart = toZonedTime(slot.start, tutorDetails.timezone);
    const zonedEnd = toZonedTime(slot.end, tutorDetails.timezone);
    return `${format(zonedStart, "h:mm a")} - ${format(zonedEnd, "h:mm a")}`;
  };

  const selectedTutor = tutors.find((t) => t.id === selectedTutorId);
  const selectedService = tutorDetails?.services.find((s) => s.id === selectedServiceId);

  // Show booking form if slot is selected
  if (selectedSlot && tutorDetails && selectedService) {
    return (
      <StudentBookingForm
        tutor={tutorDetails}
        service={selectedService}
        slot={selectedSlot}
        onBack={handleBookingBack}
        onSuccess={handleBookingSuccess}
      />
    );
  }

  // Loading state
  if (loadingTutors) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No approved tutors
  if (tutors.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-2">No Tutors Yet</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mb-4">
          Connect with tutors to book lessons. Once a tutor approves your request, you can book
          lessons here.
        </p>
        <Link
          href="/student/search"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
        >
          <Search className="h-4 w-4" />
          Find Tutors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tutor Selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Tutor</label>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between gap-3 p-3 border border-border rounded-xl bg-white hover:border-primary/50 transition"
        >
          {selectedTutor ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={selectedTutor.avatar_url || undefined}
                  alt={selectedTutor.full_name || "Tutor avatar"}
                />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {getInitials(selectedTutor.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="font-medium">
                  {selectedTutor.full_name || `@${selectedTutor.username}`}
                </div>
                <div className="text-sm text-muted-foreground">@{selectedTutor.username}</div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Choose a tutor</span>
          )}
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
            {tutors.map((tutor) => (
              <button
                key={tutor.id}
                onClick={() => {
                  setSelectedTutorId(tutor.id);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition ${
                  tutor.id === selectedTutorId ? "bg-primary/10" : ""
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={tutor.avatar_url || undefined}
                    alt={tutor.full_name || "Tutor avatar"}
                  />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {getInitials(tutor.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-medium">{tutor.full_name || `@${tutor.username}`}</div>
                  <div className="text-sm text-muted-foreground">@{tutor.username}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {loadingDetails && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {tutorDetails && !loadingDetails && (
        <>
          {/* Service Selector */}
          {tutorDetails.services.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Service</label>
              <div className="grid gap-3">
                {tutorDetails.services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceChange(service.id)}
                    className={`text-left p-4 rounded-xl border-2 transition ${
                      selectedServiceId === service.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {service.duration_minutes} min
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-lg font-bold">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(service.price_amount, service.price_currency)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-xl">
              <p className="text-muted-foreground">
                This tutor hasn&apos;t set up any services yet.
              </p>
            </div>
          )}

          {/* Available Time Slots */}
          {selectedServiceId && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Available Times
                <span className="text-muted-foreground font-normal ml-2">
                  ({tutorDetails.timezone})
                </span>
              </h3>

              {groupedSlots.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-xl">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No available times in the next 14 days</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedSlots.map((group) => (
                    <div key={group.date}>
                      <h4 className="font-medium text-gray-900 mb-3">{group.dateFormatted}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {group.slots.map((slot) => (
                          <button
                            key={slot.startISO}
                            onClick={() => handleSlotSelect(slot)}
                            className="px-4 py-3 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition text-sm font-medium"
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
          )}
        </>
      )}
    </div>
  );
}
