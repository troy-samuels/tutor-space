/**
 * Auth Module - Single source of truth for authentication and access control
 *
 * This module centralizes all authentication and authorization utilities.
 *
 * @example
 * ```ts
 * import {
 *   requireAuth,
 *   getAuthUserResult,
 *   verifyOwnership,
 *   CALENDAR_ACCESS_STATUS,
 *   canStudentBook,
 * } from "@/lib/auth";
 *
 * // In server actions:
 * export async function updateService(serviceId: string, data: any) {
 *   const result = await getAuthUserResult();
 *   if (!result.success) {
 *     return { error: result.error };
 *   }
 *   const user = result.data;
 *
 *   // Verify ownership before update
 *   const ownershipResult = await verifyOwnershipResult("services", serviceId, user.id);
 *   if (!ownershipResult.success) {
 *     return { error: ownershipResult.error };
 *   }
 *
 *   // Proceed with update...
 * }
 * ```
 */

// Server-side auth utilities
export {
  AuthError,
  type AuthResult,
  requireAuth,
  getAuthUser,
  getAuthUserResult,
  verifyOwnership,
  verifyOwnershipResult,
  getOwnedRecord,
  getOwnedRecordResult,
  getAdminClient,
  requireAdminClient,
} from "./server";

// Access status constants and helpers
export {
  // Status constants
  CALENDAR_ACCESS_STATUS,
  STUDENT_STATUS,
  CONNECTION_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SUBSCRIPTION_STATUS,
  // Types
  type CalendarAccessStatus,
  type StudentStatus,
  type ConnectionStatus,
  type BookingStatus,
  type PaymentStatus,
  type SubscriptionStatus,
  // Helper functions
  canStudentBook,
  isAccessPending,
  isAccessDenied,
  isStudentActive,
  isBookingCancelled,
  isBookingActive,
  isPaymentComplete,
  isSubscriptionActive,
} from "./access-status";
