/**
 * Calendar Access Status - Single source of truth
 *
 * Defines the possible states for student calendar access with tutors.
 * These values are stored in the `students.calendar_access_status` column.
 */
export const CALENDAR_ACCESS_STATUS = {
  /** Initial state when access has been requested but not yet reviewed */
  PENDING: "pending",
  /** Student has been approved to book lessons */
  APPROVED: "approved",
  /** Student access request was denied */
  DENIED: "denied",
  /** Student access has been suspended (previously approved) */
  SUSPENDED: "suspended",
} as const;

export type CalendarAccessStatus =
  (typeof CALENDAR_ACCESS_STATUS)[keyof typeof CALENDAR_ACCESS_STATUS];

/**
 * Student Status - Lifecycle states for students
 *
 * Defines the student relationship status with a tutor.
 * These values are stored in the `students.status` column.
 */
export const STUDENT_STATUS = {
  /** Currently active student */
  ACTIVE: "active",
  /** Student in trial period */
  TRIAL: "trial",
  /** Temporarily paused/inactive */
  PAUSED: "paused",
  /** Former student */
  ALUMNI: "alumni",
} as const;

export type StudentStatus = (typeof STUDENT_STATUS)[keyof typeof STUDENT_STATUS];

/**
 * Connection Status - Student-Tutor connections
 *
 * Status values for the `student_tutor_connections` table.
 */
export const CONNECTION_STATUS = {
  /** Connection request pending review */
  PENDING: "pending",
  /** Connection has been approved */
  APPROVED: "approved",
  /** Connection request was rejected */
  REJECTED: "rejected",
} as const;

export type ConnectionStatus =
  (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

/**
 * Booking Status - Lesson booking states
 *
 * Status values for the `bookings.status` column.
 */
export const BOOKING_STATUS = {
  /** Booking created, awaiting confirmation */
  PENDING: "pending",
  /** Booking confirmed */
  CONFIRMED: "confirmed",
  /** Lesson has been completed */
  COMPLETED: "completed",
  /** Booking cancelled */
  CANCELLED: "cancelled",
  /** Booking cancelled by tutor */
  CANCELLED_BY_TUTOR: "cancelled_by_tutor",
  /** Booking cancelled by student */
  CANCELLED_BY_STUDENT: "cancelled_by_student",
  /** Student did not show up */
  NO_SHOW: "no_show",
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

/**
 * Payment Status - Payment states for bookings
 *
 * Status values for the `bookings.payment_status` column.
 */
export const PAYMENT_STATUS = {
  /** Payment pending */
  UNPAID: "unpaid",
  /** Payment received */
  PAID: "paid",
  /** Payment refunded */
  REFUNDED: "refunded",
  /** Using prepaid package */
  PREPAID: "prepaid",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/**
 * Subscription Status - User subscription states
 *
 * Status values for the `subscriptions.status` column.
 */
export const SUBSCRIPTION_STATUS = {
  /** Active subscription */
  ACTIVE: "active",
  /** Subscription cancelled */
  CANCELED: "canceled",
  /** Payment past due */
  PAST_DUE: "past_due",
  /** In trial period */
  TRIALING: "trialing",
  /** Incomplete subscription setup */
  INCOMPLETE: "incomplete",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

/**
 * Helper functions for checking status
 */

export function canStudentBook(status: CalendarAccessStatus | null): boolean {
  return status === CALENDAR_ACCESS_STATUS.APPROVED;
}

export function isAccessPending(status: CalendarAccessStatus | null): boolean {
  return status === CALENDAR_ACCESS_STATUS.PENDING;
}

export function isAccessDenied(status: CalendarAccessStatus | null): boolean {
  return (
    status === CALENDAR_ACCESS_STATUS.DENIED ||
    status === CALENDAR_ACCESS_STATUS.SUSPENDED
  );
}

export function isStudentActive(status: StudentStatus | null): boolean {
  return (
    status === STUDENT_STATUS.ACTIVE || status === STUDENT_STATUS.TRIAL
  );
}

export function isBookingCancelled(status: BookingStatus | null): boolean {
  return (
    status === BOOKING_STATUS.CANCELLED ||
    status === BOOKING_STATUS.CANCELLED_BY_TUTOR ||
    status === BOOKING_STATUS.CANCELLED_BY_STUDENT
  );
}

export function isBookingActive(status: BookingStatus | null): boolean {
  return (
    status === BOOKING_STATUS.PENDING || status === BOOKING_STATUS.CONFIRMED
  );
}

export function isPaymentComplete(status: PaymentStatus | null): boolean {
  return (
    status === PAYMENT_STATUS.PAID || status === PAYMENT_STATUS.PREPAID
  );
}

export function isSubscriptionActive(status: SubscriptionStatus | null): boolean {
  return (
    status === SUBSCRIPTION_STATUS.ACTIVE ||
    status === SUBSCRIPTION_STATUS.TRIALING
  );
}
