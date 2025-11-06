import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

/**
 * Get Stripe.js instance
 * This is a singleton that loads Stripe once and reuses it
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error(
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Stripe will not work."
      );
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

/**
 * Redirect to Stripe Checkout
 */
export async function redirectToCheckout(sessionId: string): Promise<void> {
  const stripe = await getStripe();

  if (!stripe) {
    throw new Error("Stripe failed to load");
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });

  if (error) {
    console.error("Stripe checkout error:", error);
    throw error;
  }
}
