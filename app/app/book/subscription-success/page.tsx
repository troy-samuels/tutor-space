import Link from "next/link";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";

interface SubscriptionSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
    tutor?: string;
  }>;
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getStripe(): Stripe | null {
  if (!stripeSecretKey) return null;
  return new Stripe(stripeSecretKey, {
    apiVersion: "2025-09-30.clover",
  });
}

export default async function SubscriptionSuccessPage({
  searchParams,
}: SubscriptionSuccessPageProps) {
  const { session_id, tutor: tutorUsername } = await searchParams;

  if (!session_id) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
          <p className="text-gray-600">
            We couldn&apos;t find your subscription session. Please try again or contact support.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const stripe = getStripe();
  const adminClient = createServiceRoleClient();

  if (!stripe || !adminClient) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Service Unavailable</h1>
          <p className="text-gray-600">
            Our payment service is temporarily unavailable. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Retrieve the checkout session
  let session: Stripe.Checkout.Session | null = null;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription", "line_items", "line_items.data.price.product"],
    });
  } catch (error) {
    console.error("Failed to retrieve checkout session:", error);
  }

  if (!session || session.status !== "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Session Incomplete</h1>
          <p className="text-gray-600">
            Your subscription wasn&apos;t completed. Please try again.
          </p>
          {tutorUsername && (
            <Link
              href={`/${tutorUsername}`}
              className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Return to Tutor Page
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Get subscription details
  const subscription = session.subscription as Stripe.Subscription | null;
  const lineItem = session.line_items?.data[0];
  const product = lineItem?.price?.product as Stripe.Product | undefined;

  // Get tutor info from metadata
  const templateId = session.metadata?.template_id;
  const tutorId = session.metadata?.tutor_id;

  let tutorName = "your tutor";
  let lessonsPerMonth = 0;

  if (tutorId) {
    const { data: tutorProfile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", tutorId)
      .single();

    if (tutorProfile?.full_name) {
      tutorName = tutorProfile.full_name;
    }
  }

  if (templateId) {
    const { data: template } = await adminClient
      .from("lesson_subscription_templates")
      .select("lessons_per_month")
      .eq("id", templateId)
      .single();

    if (template?.lessons_per_month) {
      lessonsPerMonth = template.lessons_per_month;
    }
  }

  // Format price
  const priceDisplay = lineItem?.price
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: lineItem.price.currency.toUpperCase(),
      }).format((lineItem.price.unit_amount || 0) / 100)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Subscription Confirmed!
          </h1>

          <p className="text-gray-600 mb-8">
            You&apos;re now subscribed to lesson packages with{" "}
            <strong>{tutorName}</strong>. You can start booking lessons right away!
          </p>

          {/* Subscription Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-lg mb-4">Subscription Details</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tutor</span>
                <span className="font-medium">{tutorName}</span>
              </div>

              {product?.name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium">{product.name}</span>
                </div>
              )}

              {lessonsPerMonth > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Lessons per month</span>
                  <span className="font-medium">{lessonsPerMonth} lessons</span>
                </div>
              )}

              {priceDisplay && (
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-gray-600">Monthly price</span>
                  <span className="font-bold">{priceDisplay}/month</span>
                </div>
              )}
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">Your Benefits</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                <span>
                  {lessonsPerMonth > 0
                    ? `${lessonsPerMonth} lesson credits available each month`
                    : "Monthly lesson credits"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                <span>Unused lessons roll over for 1 month</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                <span>Book lessons anytime during your billing period</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                <span>Cancel anytime from your student portal</span>
              </li>
            </ul>
          </div>

          {/* Next Steps */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-green-900 mb-3">What&apos;s Next?</h3>
            <ol className="text-sm text-green-800 space-y-2">
              <li className="flex gap-2">
                <span>1.</span>
                <span>Visit your tutor&apos;s booking page to schedule your first lesson</span>
              </li>
              <li className="flex gap-2">
                <span>2.</span>
                <span>Use your subscription credits when booking (no additional payment needed)</span>
              </li>
              <li className="flex gap-2">
                <span>3.</span>
                <span>Track your remaining credits in the student portal</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {tutorUsername && (
              <Link
                href={`/${tutorUsername}`}
                className="w-full sm:w-auto inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Book a Lesson
              </Link>
            )}
            <Link
              href="/student/subscriptions"
              className="w-full sm:w-auto inline-block px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              View Subscriptions
            </Link>
          </div>

          {subscription && (
            <p className="text-xs text-gray-500 mt-6">
              Subscription ID: {subscription.id.slice(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
