"use client";

import { useState } from "react";
import Link from "next/link";
import type { LandingCopy } from "@/lib/constants/landing-copy";

type FinalCTASectionProps = {
  finalCTA: LandingCopy["finalCTA"];
};

export function FinalCTASection({ finalCTA }: FinalCTASectionProps) {
  const [revenue, setRevenue] = useState(2000);

  // Calculate savings
  const platformCost = 49;
  const averageCommission = 0.25; // 25%
  const marketplaceFees = revenue * averageCommission;
  const monthlySavings = marketplaceFees - platformCost;
  const annualSavings = monthlySavings * 12;

  return (
    <section className="bg-brand-cream py-20 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="rounded-3xl bg-brand-white p-10 shadow-2xl sm:p-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
              {finalCTA.headline}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {finalCTA.subheadline}
            </p>
          </div>

          {/* Savings calculator */}
          <div className="mt-12">
            <label
              htmlFor="revenue-slider"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {finalCTA.calculatorLabel}
            </label>

            {/* Revenue display */}
            <div className="text-center mb-4">
              <span className="text-4xl font-bold text-brand-brown">
                ${revenue.toLocaleString()}
              </span>
              <span className="text-gray-600 ml-2">{finalCTA.calculatorUnit}</span>
            </div>

            {/* Slider */}
            <input
              id="revenue-slider"
              type="range"
              min="500"
              max="10000"
              step="100"
              value={revenue}
              onChange={(e) => setRevenue(Number(e.target.value))}
              className="w-full h-2 bg-brand-cream rounded-lg appearance-none cursor-pointer accent-brand-brown"
            />

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{finalCTA.rangeMinLabel}</span>
              <span>{finalCTA.rangeMaxLabel}</span>
            </div>

            {/* Calculation breakdown */}
            <div className="mt-8 space-y-3 border-t border-gray-200 pt-6">
              <div className="flex justify-between text-gray-700">
                <span>{finalCTA.commissionLabel}</span>
                <span className="font-medium text-red-600">
                  -${marketplaceFees.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>{finalCTA.platformCostLabel}</span>
                <span className="font-medium">-${platformCost}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-3">
                <span className="text-brand-black">{finalCTA.monthlySavingsLabel}</span>
                <span className="text-brand-brown">
                  +${monthlySavings.toLocaleString()}
                </span>
              </div>
              <div className="text-center mt-4 p-4 bg-brand-cream rounded-lg">
                <div className="text-sm text-gray-600">{finalCTA.annualSavingsLabel}</div>
                <div className="text-3xl font-bold text-brand-brown mt-1">
                  ${annualSavings.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Link
              href="/signup"
              className="inline-block rounded-md bg-brand-brown px-10 py-4 text-lg font-semibold text-brand-white shadow-lg transition-all hover:bg-brand-brown/90 hover:shadow-xl hover:-translate-y-0.5"
            >
              {finalCTA.button}
            </Link>
            <p className="mt-4 text-sm text-gray-600">{finalCTA.finePrint}</p>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4 border-t border-gray-200 pt-8">
            {finalCTA.trustBadges.map((badge, index) => (
              <div
                key={index}
                className="flex items-center gap-x-2 text-sm text-gray-600"
              >
                <svg
                  className="h-5 w-5 text-brand-brown"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
