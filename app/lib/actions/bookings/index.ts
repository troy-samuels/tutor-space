"use server";

// ============================================================================
// Booking Actions - Main Entry Point
// ============================================================================
//
// This module re-exports all booking-related server actions from their
// respective modules. Import from this file for backward compatibility.
//
// Structure:
// - types.ts     - Shared types (BookingRecord, ManualBookingInput, etc.)
// - helpers.ts   - Authentication and validation helpers
// - queries.ts   - Read-only queries (listBookings, checkSlotAvailability, etc.)
// - create.ts    - Booking creation (createBooking, createBookingAndCheckout, etc.)
// - payments.ts  - Payment handling (markBookingAsPaid, sendPaymentRequest)
// - cancel.ts    - Cancellation logic
// - reschedule.ts - Rescheduling logic
//
// ============================================================================

// Types
export type { BookingRecord, ManualBookingInput, CreateBookingInput } from "./types";

// Helpers (constants and status checks)
export { MAX_RESCHEDULES, isCancelledStatus } from "./helpers";

// Queries (read-only)
export {
	listBookings,
	checkSlotAvailabilityForTutor,
	checkStudentPackages,
	getStudentNextBooking,
} from "./queries";

// Create
export {
	createBooking,
	createBookingAndCheckout,
	createManualBookingWithPaymentLink,
} from "./create";

// Payments
export { markBookingAsPaid, sendPaymentRequestForBooking } from "./payments";

// Cancel
export { cancelBooking } from "./cancel";

// Reschedule
export { rescheduleBooking } from "./reschedule";
