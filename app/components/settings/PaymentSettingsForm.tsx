"use client";

import { useState, useTransition } from "react";
import { updatePaymentSettings } from "@/lib/actions/profile";

interface PaymentSettingsFormProps {
  initialData: {
    payment_instructions: string;
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
      const result = await updatePaymentSettings({
        payment_instructions: formData.payment_instructions,
        booking_currency: formData.booking_currency,
        venmo_handle: "",
        paypal_email: "",
        zelle_phone: "",
        stripe_payment_link: "",
        custom_payment_url: "",
      });

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
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Settings</h2>
        <p className="text-sm text-gray-600 mb-6">
          Stripe Connect is required to accept payments.
        </p>

        <div className="space-y-6">
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
