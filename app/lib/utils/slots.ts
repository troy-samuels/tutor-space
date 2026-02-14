import { addDays, startOfDay, addMinutes, isBefore, isAfter, areIntervalsOverlapping, parseISO } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

export interface AvailabilitySlot {
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  is_available: boolean;
}

export interface BookableSlot {
  start: Date;
  end: Date;
  startISO: string;
  endISO: string;
  duration: number; // in minutes
  isAvailable: boolean;
}

export interface ExistingBooking {
  scheduled_at: string;
  duration_minutes: number;
  status: string;
}

export interface BusyWindow {
  start: string;
  end: string;
}

function normalizeTimezone(timezone: string): string {
  try {
    formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
    return timezone;
  } catch {
    return "UTC";
  }
}

function safeFormatInTimeZone(date: Date, timezone: string, fmt: string): string {
  const resolvedTimezone = normalizeTimezone(timezone);
  return formatInTimeZone(date, resolvedTimezone, fmt);
}

/**
 * Generate bookable time slots from weekly availability
 *
 * @param availability - Tutor's weekly availability schedule
 * @param startDate - Start date to generate slots from
 * @param endDate - End date to generate slots until
 * @param slotDuration - Duration of each slot in minutes (default: 60)
 * @param timezone - Tutor's timezone (default: UTC)
 * @param existingBookings - Existing bookings to filter out
 * @returns Array of bookable time slots
 */
export function generateBookableSlots(params: {
  availability: AvailabilitySlot[];
  startDate: Date;
  endDate: Date;
  slotDuration?: number;
  timezone?: string;
  existingBookings?: ExistingBooking[];
  busyWindows?: BusyWindow[];
  bufferMinutes?: number;
}): BookableSlot[] {
  const {
    availability,
    startDate,
    endDate,
    slotDuration = 60,
    timezone = "UTC",
    existingBookings = [],
    busyWindows = [],
    bufferMinutes = 0,
  } = params;
  const resolvedTimezone = normalizeTimezone(timezone);

  const slots: BookableSlot[] = [];

  // Convert start and end dates to the tutor's timezone
  let currentDate = startOfDay(toZonedTime(startDate, resolvedTimezone));
  const endDateZoned = startOfDay(toZonedTime(endDate, resolvedTimezone));

  // Loop through each day in the date range
  while (isBefore(currentDate, endDateZoned) || currentDate.getTime() === endDateZoned.getTime()) {
    const dayOfWeek = currentDate.getDay();

    // Find all availability slots for this day of the week
    const dayAvailability = availability.filter(
      (slot) => slot.day_of_week === dayOfWeek && slot.is_available
    );

    // Generate slots for each availability period
    for (const availSlot of dayAvailability) {
      const [startHour, startMin] = availSlot.start_time.split(":").map(Number);
      const [endHour, endMin] = availSlot.end_time.split(":").map(Number);

      // Create start and end times for this availability slot
      let slotStart = new Date(currentDate);
      slotStart.setHours(startHour, startMin, 0, 0);

      const periodEnd = new Date(currentDate);
      periodEnd.setHours(endHour, endMin, 0, 0);

      // Generate individual bookable slots within this period
      while (isBefore(slotStart, periodEnd)) {
        const slotEnd = addMinutes(slotStart, slotDuration);

        // Check if this slot goes beyond the availability period
        if (isAfter(slotEnd, periodEnd)) {
          break;
        }

        // Convert to UTC for storage
        const startUTC = fromZonedTime(slotStart, resolvedTimezone);
        const endUTC = fromZonedTime(slotEnd, resolvedTimezone);

        // Check if slot conflicts with existing bookings
        const hasConflict = checkSlotConflict(
          startUTC,
          endUTC,
          existingBookings,
          busyWindows,
          bufferMinutes
        );

        if (!hasConflict) {
          slots.push({
            start: startUTC,
            end: endUTC,
            startISO: startUTC.toISOString(),
            endISO: endUTC.toISOString(),
            duration: slotDuration,
            isAvailable: true,
          });
        }

        // Move to next slot
        slotStart = slotEnd;
      }
    }

    // Move to next day
    currentDate = addDays(currentDate, 1);
  }

  return slots;
}

/**
 * Check if a time slot conflicts with existing bookings
 */
export function checkSlotConflict(
  slotStart: Date,
  slotEnd: Date,
  existingBookings: ExistingBooking[],
  busyWindows: BusyWindow[] = [],
  bufferMinutes: number = 0
): boolean {
  const effectiveBuffer = Math.max(bufferMinutes, 0);

  const bookingConflict = existingBookings.some((booking) => {
    // Skip cancelled bookings
    if (booking.status?.startsWith("cancelled")) {
      return false;
    }

    const bookingStart = parseISO(booking.scheduled_at);
    const bookingEnd = addMinutes(bookingStart, booking.duration_minutes);
    const bufferedBookingStart = effectiveBuffer
      ? addMinutes(bookingStart, -effectiveBuffer)
      : bookingStart;
    const bufferedBookingEnd = effectiveBuffer
      ? addMinutes(bookingEnd, effectiveBuffer)
      : bookingEnd;

    // Check if intervals overlap
    return areIntervalsOverlapping(
      { start: slotStart, end: slotEnd },
      { start: bufferedBookingStart, end: bufferedBookingEnd },
      { inclusive: false } // Don't consider touching intervals as overlapping
    );
  });

  if (bookingConflict) {
    return true;
  }

  if (!busyWindows.length) {
    return false;
  }

  return busyWindows.some((window) => {
    const windowStart = parseISO(window.start);
    const windowEnd = parseISO(window.end);

    if (Number.isNaN(windowStart.getTime()) || Number.isNaN(windowEnd.getTime())) {
      return false;
    }

    const bufferedWindowStart = effectiveBuffer
      ? addMinutes(windowStart, -effectiveBuffer)
      : windowStart;
    const bufferedWindowEnd = effectiveBuffer
      ? addMinutes(windowEnd, effectiveBuffer)
      : windowEnd;

    return areIntervalsOverlapping(
      { start: slotStart, end: slotEnd },
      { start: bufferedWindowStart, end: bufferedWindowEnd },
      { inclusive: false }
    );
  });
}

/**
 * Group slots by date for easier display
 */
export function groupSlotsByDate(slots: BookableSlot[], timezone: string = "UTC") {
  const grouped = new Map<
    string,
    { dateFormatted: string; slots: BookableSlot[] }
  >();

  for (const slot of slots) {
    const dateKey = safeFormatInTimeZone(slot.start, timezone, "yyyy-MM-dd");

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {
        dateFormatted: safeFormatInTimeZone(slot.start, timezone, "EEEE, MMMM d, yyyy"),
        slots: [],
      });
    }

    grouped.get(dateKey)!.slots.push(slot);
  }

  return Array.from(grouped.entries()).map(([date, entry]) => ({
    date,
    dateFormatted: entry.dateFormatted,
    slots: entry.slots,
  }));
}

/**
 * Filter slots to only include future slots (from now)
 */
export function filterFutureSlots(slots: BookableSlot[]): BookableSlot[] {
  const now = new Date();
  return slots.filter((slot) => isAfter(slot.start, now));
}

/**
 * Format slot time for display
 */
export function formatSlotTime(slot: BookableSlot, timezone: string = "UTC"): string {
  const startLabel = safeFormatInTimeZone(slot.start, timezone, "h:mm a");
  const endLabel = safeFormatInTimeZone(slot.end, timezone, "h:mm a");
  return `${startLabel} - ${endLabel}`;
}
