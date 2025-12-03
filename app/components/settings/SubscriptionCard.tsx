"use client";

import { useState } from "react";

interface SubscriptionCardProps {
  title: string;
  price: string;
  subtitle?: string;
  features: string[];
  isCurrent?: boolean;
}

export default function SubscriptionCard({
  title,
  price,
  subtitle,
  features,
  isCurrent = false,
}: SubscriptionCardProps) {
  const [loading] = useState(false);

  return (
    <div
      className={`border rounded-lg p-6 ${
        isCurrent
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-3xl font-bold mt-2">{price}</p>
        {subtitle ? (
          <p className="text-gray-600 text-sm">{subtitle}</p>
        ) : null}
      </div>

      <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <button
          disabled
          className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium cursor-not-allowed"
        >
          Current Plan
        </button>
      ) : (
        <button
          disabled={loading}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
        >
          {loading ? "Processing..." : "Select Plan"}
        </button>
      )}
    </div>
  );
}
