"use client";

import { useState, useTransition } from "react";
import { updatePaymentSettings } from "@/lib/actions/profile";

interface PaymentSettingsFormProps {
  initialData: {
    payment_instructions: string;
    venmo_handle: string;
    paypal_email: string;
    zelle_phone: string;
    stripe_payment_link: string;
    custom_payment_url: string;
    booking_currency: string;
  };
}

export default function PaymentSettingsForm({
  initialData,
}: PaymentSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await updatePaymentSettings(formData);

      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({
          type: "success",
          text: "Payment settings updated successfully!",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* General Instructions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">
          General Payment Instructions
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Optional: Add general instructions that will be shown to all students.
          This appears first before your payment methods.
        </p>

        <div>
          <label
            htmlFor="payment_instructions"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Instructions (Optional)
          </label>
          <textarea
            id="payment_instructions"
            rows={4}
            value={formData.payment_instructions}
            onChange={(e) =>
              setFormData({
                ...formData,
                payment_instructions: e.target.value,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="Example: Please send payment within 24 hours of booking. Include your name and booking date in the payment note."
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be displayed at the top of the payment section
          </p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
        <p className="text-sm text-gray-600 mb-6">
          Add at least one payment method. Students will see these options after
          booking.
        </p>

        <div className="space-y-6">
          {/* Venmo */}
          <div>
            <label
              htmlFor="venmo_handle"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Venmo Username
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">@</span>
              <input
                type="text"
                id="venmo_handle"
                value={formData.venmo_handle}
                onChange={(e) =>
                  setFormData({ ...formData, venmo_handle: e.target.value })
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="your-venmo-handle"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Don&apos;t include the @ symbol
            </p>
          </div>

          {/* PayPal */}
          <div>
            <label
              htmlFor="paypal_email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              PayPal Email
            </label>
            <input
              type="email"
              id="paypal_email"
              value={formData.paypal_email}
              onChange={(e) =>
                setFormData({ ...formData, paypal_email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="your-email@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your PayPal.me link will be generated automatically
            </p>
          </div>

          {/* Zelle */}
          <div>
            <label
              htmlFor="zelle_phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Zelle Phone or Email
            </label>
            <input
              type="text"
              id="zelle_phone"
              value={formData.zelle_phone}
              onChange={(e) =>
                setFormData({ ...formData, zelle_phone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="+1 234 567 8900 or email@example.com"
            />
          </div>

          {/* Stripe Payment Link */}
          <div>
            <label
              htmlFor="stripe_payment_link"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Stripe Payment Link
            </label>
            <input
              type="url"
              id="stripe_payment_link"
              value={formData.stripe_payment_link}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stripe_payment_link: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="https://buy.stripe.com/..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Create a payment link in your Stripe dashboard
            </p>
          </div>

          {/* Custom Payment URL */}
          <div>
            <label
              htmlFor="custom_payment_url"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Custom Payment URL
            </label>
            <input
              type="url"
              id="custom_payment_url"
              value={formData.custom_payment_url}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  custom_payment_url: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="https://yourwebsite.com/pay"
            />
            <p className="text-xs text-gray-500 mt-1">
              Any other payment page URL (Square, PayPal, etc.)
            </p>
          </div>

          {/* Booking Currency */}
          <div>
            <label
              htmlFor="booking_currency"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Booking Currency
            </label>
            <select
              id="booking_currency"
              value={formData.booking_currency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  booking_currency: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
            >
              <option value="USD">USD — $ (United States)</option>
              <option value="EUR">EUR — € (Eurozone)</option>
              <option value="GBP">GBP — £ (United Kingdom)</option>
              <option value="CAD">CAD — $ (Canada)</option>
              <option value="AUD">AUD — $ (Australia)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This currency will be shown on invoices and booking checkout flows.
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-800" : "text-red-800"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving..." : "Save Payment Settings"}
        </button>
      </div>
    </form>
  );
}
