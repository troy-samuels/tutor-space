import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BillingPortalButton from "@/components/settings/BillingPortalButton";
import SubscriptionCard from "@/components/settings/SubscriptionCard";

export default async function BillingPage() {
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

  // Get active subscription if any
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .single();

  const currentPlan = profile?.plan || "professional";
  const displayPlan =
    currentPlan === "founder_lifetime" ? "Founder lifetime" : "All-access";
  const hasStripeCustomer = !!profile?.stripe_customer_id;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold capitalize">{displayPlan}</span>
              {subscription && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Active
                </span>
              )}
            </div>
            {subscription && (
              <p className="text-gray-600 mt-1">
                Renews on {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>

          {hasStripeCustomer && (
            <BillingPortalButton />
          )}
        </div>
      </div>

      {/* Plan Features */}
      <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-6">
        <SubscriptionCard
          title="All-access"
          price="$29/mo or $199/yr"
          subtitle="Full platform access. No tiers."
          features={[
            "All current features included",
            "Calendar sync keeps you aligned with Preply/iTalki bookings",
            "Direct booking tools so you own your student base",
            "0% platform commission on direct payments",
            "Site builder, CRM, messaging, automation, AI",
            "Priority support for tutors",
          ]}
          isCurrent
        />
      </div>

      {/* Billing History - Only show if has Stripe customer */}
      {hasStripeCustomer && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Billing History</h2>
          <p className="text-gray-600 text-sm mb-4">
            View and download your invoices through the billing portal
          </p>
          <BillingPortalButton variant="secondary" />
        </div>
      )}

      {/* Payment Method - Only show if has Stripe customer */}
      {hasStripeCustomer && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
          <p className="text-gray-600 text-sm mb-4">
            Manage your payment methods through the billing portal
          </p>
          <BillingPortalButton variant="secondary" text="Manage Payment Methods" />
        </div>
      )}

      {/* No Stripe customer notice */}
      {!hasStripeCustomer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Get Started</h3>
          <p className="text-blue-800 text-sm">
            Subscribe to a paid plan to unlock premium features and grow your tutoring business.
          </p>
          <div className="mt-4">
            <ConnectStripeButton />
          </div>
        </div>
      )}
    </div>
  );
}
