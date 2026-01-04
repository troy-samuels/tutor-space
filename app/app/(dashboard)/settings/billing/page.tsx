import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BillingPortalButton from "@/components/settings/BillingPortalButton";
import { PlatformSubscriptionCTA } from "@/components/settings/PlatformSubscriptionCTA";
import { UpgradePlanCard } from "@/components/settings/UpgradePlanCard";
import { getPlanTier } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import {
  Calendar,
  Users,
  CreditCard,
  RefreshCw,
  Mail,
  Package,
  Globe,
  BarChart3,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Quote,
} from "lucide-react";

// Feature list for all states
const FEATURES = [
  { icon: Calendar, text: "Professional booking page" },
  { icon: Users, text: "Student CRM with notes & history" },
  { icon: CreditCard, text: "Stripe payments (0% platform fees)" },
  { icon: RefreshCw, text: "Calendar sync (Google, Outlook)" },
  { icon: Mail, text: "Email reminders & marketing" },
  { icon: Package, text: "Session packages & bundles" },
  { icon: Globe, text: "Custom tutor website builder" },
  { icon: BarChart3, text: "Analytics dashboard" },
];

// Testimonials for social proof
const TESTIMONIALS = {
  trial: {
    quote: "Saved me $7,500 in commissions this year.",
    author: "Alba GB.",
    role: "Spanish Teacher",
  },
  expired: {
    quote: "12 lessons booked in the first week.",
    author: "Thomas B.",
    role: "French Tutor",
  },
};

// Value comparison data
const VALUE_COMPARISON = {
  competitors: "$132/month",
  tutorlingua: "$29/month",
  tools: "Calendly + Stripe + CRM + Website",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string | string[] }>;
}) {
  const { upgrade } = await searchParams;
  const selectedTier = upgrade === "studio" ? "studio" : "pro";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get profile with current plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, stripe_customer_id")
    .eq("id", user.id)
    .single();

  // Get active or trialing subscription if any
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", user.id)
    .in("status", ["active", "trialing"])
    .single();

  const currentPlan = (profile?.plan || "professional") as PlatformBillingPlan;
  const hasPaidPlan = currentPlan !== "professional";
  const hasStripeCustomer = !!profile?.stripe_customer_id;
  const isTrialing = subscription?.status === "trialing";
  const isLifetime = currentPlan === "tutor_life" || currentPlan === "founder_lifetime" || currentPlan === "studio_life";
  const isActiveSubscriber = !isLifetime && subscription?.status === "active";
  const isExpiredOrFree = currentPlan === "professional" && !subscription;

  // Determine tier for upgrade logic
  const planTier = getPlanTier(currentPlan);
  const isProTier = planTier === "pro";
  const isStudioTier = planTier === "studio";

  // Determine current billing cycle for upgrade component
  const currentBillingCycle: "monthly" | "annual" =
    currentPlan.includes("annual") ? "annual" : "monthly";

  const planLabel = (() => {
    if (isLifetime) return "Lifetime";
    if (String(currentPlan).startsWith("studio")) return "Studio";
    return "Pro";
  })();

  const displayTierLabel = selectedTier === "studio" ? "Studio" : "Pro";
  const displayMonthlyPrice = selectedTier === "studio" ? "$79/month" : "$29/month";
  const displayAnnualPrice = selectedTier === "studio" ? "$499/year" : "$199/year";

  // Calculate days remaining in trial
  let trialDaysRemaining: number | null = null;
  if (isTrialing && subscription?.current_period_end) {
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    trialDaysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
  }

  // Calculate trial progress percentage (14 day trial)
  const trialPercentRemaining =
    trialDaysRemaining !== null
      ? Math.round((trialDaysRemaining / 14) * 100)
      : 0;

  // Progress bar color based on urgency
  const getProgressColor = () => {
    if (!trialDaysRemaining) return "bg-blue-500";
    if (trialDaysRemaining <= 3) return "bg-red-500";
    if (trialDaysRemaining <= 7) return "bg-amber-500";
    return "bg-blue-500";
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold">Your TutorLingua Plan</h1>

      {/* ============================================ */}
      {/* TRIALING STATE - Show value + conversion CTA */}
      {/* ============================================ */}
      {isTrialing && trialDaysRemaining !== null && (
        <>
          {/* Trial Status Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Trial
                </h2>
                <p className="text-blue-700 font-medium">
                  {trialDaysRemaining}{" "}
                  {trialDaysRemaining === 1 ? "day" : "days"} remaining
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className={`h-2.5 rounded-full transition-all ${getProgressColor()}`}
                style={{ width: `${trialPercentRemaining}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              {trialPercentRemaining}% of trial remaining
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Add a payment method now to keep access when your trial ends. You won&apos;t be charged until the trial is over.
              </p>
              <div className="w-full sm:w-auto">
                <PlatformSubscriptionCTA tier={selectedTier} ctaLabel="Add payment method" />
              </div>
            </div>
          </div>

          {/* Features Included */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What&apos;s Included in Your Trial
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-1.5 bg-green-100 rounded-full">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Continue After Trial CTA */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Continue After Your Trial
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              No charge today. Billing starts when your trial ends.
            </p>
            <PlatformSubscriptionCTA
              tier={selectedTier}
              defaultCycle="annual"
              ctaLabel="Add Payment Method"
            />
          </div>

          {/* Testimonial */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex gap-3">
              <Quote className="h-8 w-8 text-gray-300 flex-shrink-0" />
              <div>
                <p className="text-gray-700 italic mb-2">
                  &quot;{TESTIMONIALS.trial.quote}&quot;
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">
                    {TESTIMONIALS.trial.author}
                  </span>{" "}
                  &middot; {TESTIMONIALS.trial.role}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* EXPIRED/FREE STATE - Urgent loss-focused CTA */}
      {/* ============================================ */}
      {isExpiredOrFree && (
        <>
          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-amber-900">
                  Your trial has ended
                </h2>
                <p className="text-amber-700 text-sm mt-1">
                  Premium features paused. Reactivate to continue.
                </p>
              </div>
            </div>
          </div>

          {/* Features Lost */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Features you&apos;re missing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-1.5 bg-red-100 rounded-full">
                    <X className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-gray-500 text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Value Comparison */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Compare the cost
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm">
                  {VALUE_COMPARISON.tools}
                </span>
                <span className="text-red-500 font-semibold line-through">
                  {VALUE_COMPARISON.competitors}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-800 font-medium">
                  TutorLingua {displayTierLabel}
                </span>
                <div className="text-right">
                  <span className="text-green-700 font-bold text-lg">
                    {displayMonthlyPrice}
                  </span>
                  <p className="text-green-600 text-xs">or {displayAnnualPrice}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reactivate CTA */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <PlatformSubscriptionCTA
              tier={selectedTier}
              defaultCycle="annual"
              ctaLabel="Reactivate My Account"
            />
          </div>

          {/* Testimonial */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex gap-3">
              <Quote className="h-8 w-8 text-gray-300 flex-shrink-0" />
              <div>
                <p className="text-gray-700 italic mb-2">
                  &quot;{TESTIMONIALS.expired.quote}&quot;
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">
                    {TESTIMONIALS.expired.author}
                  </span>{" "}
                  &middot; {TESTIMONIALS.expired.role}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* ACTIVE SUBSCRIBER STATE - Confirmation + Portal */}
      {/* ============================================ */}
      {(isActiveSubscriber || isLifetime) && (
        <>
          {/* Active Plan Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isLifetime ? "Lifetime" : planLabel}
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
              {hasStripeCustomer && !isLifetime && (
                <BillingPortalButton />
              )}
            </div>

            {subscription && !isLifetime && (
              <p className="text-gray-600 text-sm">
                Renews on{" "}
                {new Date(subscription.current_period_end).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </p>
            )}
            {isLifetime && (
              <p className="text-green-700 text-sm font-medium">
                Lifetime access &mdash; no renewal needed
              </p>
            )}
          </div>

          {/* Your Benefits */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Benefits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-1.5 bg-green-100 rounded-full">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade to Studio — Only show for Pro users (not Studio, not Lifetime) */}
          {isActiveSubscriber && isProTier && !isStudioTier && !isLifetime && (
            <UpgradePlanCard
              currentPlan={currentPlan}
              currentBillingCycle={currentBillingCycle}
            />
          )}

          {/* Billing Management - Only for non-lifetime */}
          {hasStripeCustomer && !isLifetime && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Billing History
                  </h3>
                  <p className="text-gray-500 text-sm">
                    View invoices and receipts
                  </p>
                </div>
                <BillingPortalButton variant="secondary" />
              </div>
              <hr className="border-gray-100" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Payment Method
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Update your card on file
                  </p>
                </div>
                <BillingPortalButton variant="secondary" text="Update" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
