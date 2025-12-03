import { parseISO, addMinutes, areIntervalsOverlapping } from "date-fns";

type Booking = {
  id?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  status?: string;
};

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingBooking?: {
    id: string;
    scheduled_at: string;
    status: string;
  };
  message?: string;
}

/**
 * Check if a new booking would conflict with existing bookings
 *
 * @param tutorId - Tutor's user ID
 * @param scheduledAt - Proposed booking start time (ISO string)
 * @param durationMinutes - Proposed booking duration
 * @param existingBookings - Tutor's existing bookings
 * @returns Conflict check result
 */
export function checkBookingConflict(
  scheduledAt: string,
  durationMinutes: number,
  existingBookings: Partial<Booking>[]
): ConflictCheck {
  const proposedStart = parseISO(scheduledAt);
  const proposedEnd = addMinutes(proposedStart, durationMinutes);

  for (const booking of existingBookings) {
    // Skip cancelled bookings
    if (
      booking.status === "cancelled_by_tutor" ||
      booking.status === "cancelled_by_student"
    ) {
      continue;
    }

    if (!booking.scheduled_at || !booking.duration_minutes) {
      continue;
    }

    const bookingStart = parseISO(booking.scheduled_at);
    const bookingEnd = addMinutes(bookingStart, booking.duration_minutes);

    // Check if intervals overlap
    const overlaps = areIntervalsOverlapping(
      { start: proposedStart, end: proposedEnd },
      { start: bookingStart, end: bookingEnd },
      { inclusive: false }
    );

    if (overlaps) {
      return {
        hasConflict: true,
        conflictingBooking: {
          id: booking.id!,
          scheduled_at: booking.scheduled_at,
          status: booking.status!,
        },
        message: `This time slot conflicts with an existing ${booking.status} booking.`,
      };
    }
  }

  return {
    hasConflict: false,
  };
}

/**
 * Check if booking is within tutor's availability
 *
 * @param scheduledAt - Booking start time
 * @param durationMinutes - Booking duration
 * @param availability - Tutor's weekly availability
 * @returns Whether booking fits in availability
 */
export function checkWithinAvailability(
  scheduledAt: string,
  durationMinutes: number,
  availability: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }>
): { isWithinAvailability: boolean; message?: string } {
  const bookingStart = parseISO(scheduledAt);
  const bookingEnd = addMinutes(bookingStart, durationMinutes);

  const dayOfWeek = bookingStart.getDay();
  const bookingStartTime = `${String(bookingStart.getHours()).padStart(2, "0")}:${String(
    bookingStart.getMinutes()
  ).padStart(2, "0")}`;
  const bookingEndTime = `${String(bookingEnd.getHours()).padStart(2, "0")}:${String(
    bookingEnd.getMinutes()
  ).padStart(2, "0")}`;

  // Find availability slots for this day
  const dayAvailability = availability.filter(
    (slot) => slot.day_of_week === dayOfWeek && slot.is_available
  );

  if (dayAvailability.length === 0) {
    return {
      isWithinAvailability: false,
      message: "Tutor is not available on this day of the week.",
    };
  }

  // Check if booking fits within any availability slot
  for (const slot of dayAvailability) {
    if (bookingStartTime >= slot.start_time && bookingEndTime <= slot.end_time) {
      return {
        isWithinAvailability: true,
      };
    }
  }

  return {
    isWithinAvailability: false,
    message: "This time is outside the tutor's available hours.",
  };
}

/**
 * Get buffer time conflicts (e.g., minimum time between bookings)
 *
 * @param scheduledAt - Proposed booking start time
 * @param durationMinutes - Proposed booking duration
 * @param bufferMinutes - Required buffer time between bookings
 * @param existingBookings - Existing bookings
 * @returns Whether booking respects buffer time
 */
export function checkBufferTime(
  scheduledAt: string,
  durationMinutes: number,
  bufferMinutes: number,
  existingBookings: Partial<Booking>[]
): { hasBufferConflict: boolean; message?: string } {
  if (bufferMinutes === 0) {
    return { hasBufferConflict: false };
  }

  const proposedStart = parseISO(scheduledAt);
  const proposedEnd = addMinutes(proposedStart, durationMinutes);

  // Add buffer time to the proposed booking
  const bufferedStart = addMinutes(proposedStart, -bufferMinutes);
  const bufferedEnd = addMinutes(proposedEnd, bufferMinutes);

  for (const booking of existingBookings) {
    // Skip cancelled bookings
    if (
      booking.status === "cancelled_by_tutor" ||
      booking.status === "cancelled_by_student"
    ) {
      continue;
    }

    if (!booking.scheduled_at || !booking.duration_minutes) {
      continue;
    }

    const bookingStart = parseISO(booking.scheduled_at);
    const bookingEnd = addMinutes(bookingStart, booking.duration_minutes);

    // Check if buffered intervals overlap
    const overlaps = areIntervalsOverlapping(
      { start: bufferedStart, end: bufferedEnd },
      { start: bookingStart, end: bookingEnd },
      { inclusive: true }
    );

    if (overlaps) {
      return {
        hasBufferConflict: true,
        message: `This time slot is too close to an existing booking (${bufferMinutes} minute buffer required).`,
      };
    }
  }

  return { hasBufferConflict: false };
}

type BusyWindow = { start: string; end: string };

/**
 * Check conflicts against external calendar busy windows
 */
export function checkExternalBusy(
  scheduledAt: string,
  durationMinutes: number,
  busyWindows: BusyWindow[]
): { hasConflict: boolean; message?: string } {
  if (!busyWindows.length) {
    return { hasConflict: false };
  }

  const proposedStart = parseISO(scheduledAt);
  const proposedEnd = addMinutes(proposedStart, durationMinutes);

  for (const window of busyWindows) {
    const windowStart = parseISO(window.start);
    const windowEnd = parseISO(window.end);

    if (Number.isNaN(windowStart.getTime()) || Number.isNaN(windowEnd.getTime())) {
      continue;
    }

    const overlaps = areIntervalsOverlapping(
      { start: proposedStart, end: proposedEnd },
      { start: windowStart, end: windowEnd },
      { inclusive: false }
    );

    if (overlaps) {
      return {
        hasConflict: true,
        message: "This time conflicts with an external calendar event.",
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Comprehensive booking validation
 *
 * @param params - Validation parameters
 * @returns Validation result with all checks
 */
export function validateBooking(params: {
  scheduledAt: string;
  durationMinutes: number;
  availability: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }>;
  existingBookings: Partial<Booking>[];
  bufferMinutes?: number;
  busyWindows?: BusyWindow[];
}): {
  isValid: boolean;
  errors: string[];
} {
  const {
    scheduledAt,
    durationMinutes,
    availability,
    existingBookings,
    bufferMinutes = 0,
    busyWindows = [],
  } = params;

  const errors: string[] = [];

  // Check if in the past
  const bookingDate = parseISO(scheduledAt);
  if (bookingDate < new Date()) {
    errors.push("Cannot book a time slot in the past.");
  }

  // Check availability
  const availabilityCheck = checkWithinAvailability(
    scheduledAt,
    durationMinutes,
    availability
  );
  if (!availabilityCheck.isWithinAvailability && availabilityCheck.message) {
    errors.push(availabilityCheck.message);
  }

  // Check conflicts
  const conflictCheck = checkBookingConflict(
    scheduledAt,
    durationMinutes,
    existingBookings
  );
  if (conflictCheck.hasConflict && conflictCheck.message) {
    errors.push(conflictCheck.message);
  }

  // Check buffer time
  const bufferCheck = checkBufferTime(
    scheduledAt,
    durationMinutes,
    bufferMinutes,
    existingBookings
  );
  if (bufferCheck.hasBufferConflict && bufferCheck.message) {
    errors.push(bufferCheck.message);
  }

  const externalConflict = checkExternalBusy(scheduledAt, durationMinutes, busyWindows);
  if (externalConflict.hasConflict && externalConflict.message) {
    errors.push(externalConflict.message);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
