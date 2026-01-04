"use client";

import { Check, X } from "lucide-react";

const comparisonData = {
  monthly: {
    title: "Monthly Plan",
    price: "$29-$79/mo",
    features: [
      { text: "Pro features ($29/mo)", included: true },
      { text: "Studio features (+$79/mo)", included: true },
      { text: "Unlimited students", included: true },
      { text: "Ongoing monthly cost", included: false, negative: true },
      { text: "$1,296/year for Pro+Studio", included: false, negative: true },
      { text: "$3,888 over 3 years", included: false, negative: true },
    ],
  },
  lifetime: {
    title: "Lifetime Deal",
    price: "$99 one-time",
    badge: "Best Value",
    features: [
      { text: "All Pro features", included: true },
      { text: "All Studio features ($79/mo value)", included: true, highlight: true },
      { text: "Unlimited students", included: true },
      { text: "Pay once, own forever", included: true, highlight: true },
      { text: "All future updates included", included: true, highlight: true },
      { text: "Lock in founder pricing", included: true, highlight: true },
    ],
  },
};

export function LifetimeComparison() {
  return (
    <section className="bg-brand-white py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why Lifetime Makes Sense
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Compare the numbers. The lifetime deal pays for itself in less than 2 months.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Monthly Plan */}
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-8">
            <h3 className="text-xl font-semibold text-gray-700">
              {comparisonData.monthly.title}
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-600">
              {comparisonData.monthly.price}
            </p>
            <ul className="mt-8 space-y-4">
              {comparisonData.monthly.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  {feature.negative ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
                      <X className="h-4 w-4 text-red-500" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                      <Check className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                  <span className={feature.negative ? "text-gray-500" : "text-gray-700"}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Lifetime Deal */}
          <div className="relative rounded-2xl border-2 border-primary bg-primary/5 p-8 shadow-lg">
            {comparisonData.lifetime.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-md">
                  {comparisonData.lifetime.badge}
                </span>
              </div>
            )}
            <h3 className="text-xl font-semibold text-foreground">
              {comparisonData.lifetime.title}
            </h3>
            <p className="mt-2 text-3xl font-bold text-primary">
              {comparisonData.lifetime.price}
            </p>
            <ul className="mt-8 space-y-4">
              {comparisonData.lifetime.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    feature.highlight ? "bg-primary" : "bg-primary/20"
                  }`}>
                    <Check className={`h-4 w-4 ${feature.highlight ? "text-white" : "text-primary"}`} />
                  </div>
                  <span className={feature.highlight ? "font-semibold text-foreground" : "text-gray-700"}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Savings callout */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-8 text-center">
          <p className="text-lg text-gray-700">
            Pro + Studio monthly would cost{" "}
            <span className="font-bold text-foreground">$936/year</span>.
          </p>
          <p className="mt-2 text-2xl font-bold text-primary">
            Save $837+ in year one with the lifetime deal.
          </p>
        </div>
      </div>
    </section>
  );
}
