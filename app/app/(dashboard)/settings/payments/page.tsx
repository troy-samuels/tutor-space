import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PaymentSettingsForm from "@/components/settings/PaymentSettingsForm";

export default async function PaymentSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get current payment settings
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "payment_instructions, venmo_handle, paypal_email, zelle_phone, stripe_payment_link, custom_payment_url"
    )
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payment Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure how students will pay you for lessons
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">
              About Payment Collection
            </h3>
            <p className="text-sm text-blue-800 mt-1">
              Students pay you directly using your preferred payment method.
              The information you provide here will be shown to students after
              they book a lesson. You&apos;ll receive booking requests and can
              confirm them once payment is received.
            </p>
          </div>
        </div>
      </div>

      <PaymentSettingsForm
        initialData={{
          payment_instructions: profile?.payment_instructions || "",
          venmo_handle: profile?.venmo_handle || "",
          paypal_email: profile?.paypal_email || "",
          zelle_phone: profile?.zelle_phone || "",
          stripe_payment_link: profile?.stripe_payment_link || "",
          custom_payment_url: profile?.custom_payment_url || "",
        }}
      />

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">💡 Tips for Payment Collection</h2>

        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-medium text-gray-900">1. Be Clear About Payment Timing</h3>
            <p className="mt-1">
              Let students know when payment is expected (e.g., &quot;Payment required
              within 24 hours of booking&quot; or &quot;Pay after the lesson&quot;)
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">2. Offer Multiple Options</h3>
            <p className="mt-1">
              Providing several payment methods (Venmo, PayPal, Zelle) makes it
              easier for students to pay
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">3. Use Payment Links</h3>
            <p className="mt-1">
              If you have a Stripe Payment Link or other payment URL, add it here
              so students can pay with one click
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">4. Include Reference Instructions</h3>
            <p className="mt-1">
              Ask students to include their name or booking ID when sending payment
              so you can easily match it
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
