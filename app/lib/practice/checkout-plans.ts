import type { StudentPracticeSubscription } from "@/lib/types/payments";
import type { AttributionCookie } from "@/lib/practice/attribution";
import {
  SOLO_PRICE_CENTS,
  UNLIMITED_PRICE_CENTS,
} from "@/lib/practice/constants";

export type PracticeCheckoutPlan = {
  subscription: Exclude<StudentPracticeSubscription, null>;
  priceCents: number;
  productName: string;
  productDescription: string;
  successPath: string;
  cancelPath: string;
};

/**
 * Resolves the checkout plan based on whether a student is tutor-linked.
 *
 * @param tutorId - Tutor UUID when linked, otherwise `null`.
 * @param attribution - Optional attribution metadata used to preserve tutor-linked pricing.
 * @returns Plan metadata used for Stripe product/price/session creation.
 */
export function resolveCheckoutPlan(
  tutorId: string | null,
  attribution?: Pick<AttributionCookie, "tutorId"> | null
): PracticeCheckoutPlan {
  const effectiveTutorId = tutorId || attribution?.tutorId || null;

  if (effectiveTutorId) {
    return {
      subscription: "unlimited",
      priceCents: UNLIMITED_PRICE_CENTS,
      productName: "Unlimited Practice",
      productDescription: "Unlimited AI practice sessions with adaptive voice features.",
      successPath: "/student/practice/subscribe/success",
      cancelPath: "/student/practice/subscribe",
    };
  }

  return {
    subscription: "solo",
    priceCents: SOLO_PRICE_CENTS,
    productName: "Solo Unlimited Practice",
    productDescription: "Unlimited solo AI practice sessions for independent students.",
    successPath: "/student/practice/subscribe/success",
    cancelPath: "/student/practice/subscribe",
  };
}
