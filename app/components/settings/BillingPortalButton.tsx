"use client";

import { useState } from "react";

interface BillingPortalButtonProps {
  variant?: "primary" | "secondary";
  text?: string;
}

export default function BillingPortalButton({
  variant = "primary",
  text = "Manage Billing",
}: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/stripe/billing-portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.error) {
        console.error("Error creating billing portal session:", data.error);
        alert("Failed to open billing portal. Please try again.");
        return;
      }

      // Redirect to Stripe billing portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isPrimary = variant === "primary";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
        isPrimary
          ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
          : "bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-50"
      }`}
    >
      {loading ? "Loading..." : text}
    </button>
  );
}
