"use client";

import { useState } from "react";

interface SubscriptionCardProps {
  plan: "professional" | "growth" | "studio";
  price: string;
  features: string[];
  currentPlan: string;
}

export default function SubscriptionCard({
  plan,
  price,
  features,
  currentPlan,
}: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);
  const isCurrentPlan = currentPlan === plan;
  const isProfessional = plan === "professional";
  const isUpgrade = !isProfessional && currentPlan === "professional";

  const handleSubscribe = async () => {
    if (isProfessional) {
      alert("You are already on the Professional (free) plan");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("Error creating subscription:", data.error);
        alert(`Failed to create subscription: ${data.error}`);
        return;
      }

      // Redirect to billing portal or handle payment confirmation
      alert("Subscription created! You will be redirected to complete payment.");
      window.location.href = "/settings/billing";
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`border rounded-lg p-6 ${
        isCurrentPlan
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold capitalize">{plan}</h3>
        <p className="text-3xl font-bold mt-2">{price}</p>
        {price !== "$0" && (
          <p className="text-gray-600 text-sm">Billed monthly</p>
        )}
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <button
          disabled
          className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium cursor-not-allowed"
        >
          Current Plan
        </button>
      ) : isProfessional ? (
        <button
          disabled
          className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium cursor-not-allowed"
        >
          Free Plan
        </button>
      ) : (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {loading
            ? "Processing..."
            : isUpgrade
            ? "Upgrade"
            : "Change Plan"}
        </button>
      )}
    </div>
  );
}
