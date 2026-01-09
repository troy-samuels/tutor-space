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
    <form onSubmit={handleSubmit} className="py-4 space-y-4">
      {/* Booking Currency */}
      <div>
        <label
          htmlFor="booking_currency"
          className="block text-sm font-medium mb-1.5"
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
          className="w-full max-w-xs px-3 py-2 text-sm border border-stone-200 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        >
          <option value="USD">USD — $</option>
          <option value="EUR">EUR — €</option>
          <option value="GBP">GBP — £</option>
          <option value="CAD">CAD — $</option>
          <option value="AUD">AUD — $</option>
        </select>
        <p className="text-xs text-muted-foreground mt-1.5">
          Used for invoices and checkout.
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Submit Button */}
      <div className="flex justify-start pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm bg-primary text-white rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
