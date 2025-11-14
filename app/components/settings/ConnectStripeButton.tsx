"use client";

import { useState } from "react";

interface ConnectStripeButtonProps {
  variant?: "primary" | "secondary";
  onConnected?: () => void;
}

export default function ConnectStripeButton({
  variant = "primary",
  onConnected,
}: ConnectStripeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/sync-customer", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || "Failed to connect to Stripe.");
        return;
      }

      if (onConnected) {
        onConnected();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Error syncing Stripe customer", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isPrimary = variant === "primary";

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          isPrimary
            ? "bg-brand-brown text-white hover:bg-brand-brown/90 disabled:bg-brand-brown/60"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-100"
        }`}
      >
        {loading ? "Connecting…" : "Connect Stripe"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
