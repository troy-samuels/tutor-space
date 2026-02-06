"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  PLATFORM_COMMISSIONS,
  SUPPORTED_CURRENCIES,
  type PlatformCommission,
} from "@/lib/constants/commission-rates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const TUTORLINGUA_MONTHLY_COST = 29; // Pro plan subscription

function formatCurrency(amount: number, currency: string): string {
  const currencyData = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
  const symbol = currencyData?.symbol || "$";

  if (currency === "JPY" || currency === "KRW") {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

type CalculatorState = {
  platform: string;
  hourlyRate: number;
  lessonsPerMonth: number;
  currency: string;
  lessonDuration: number;
};

type EarningsResult = {
  grossMonthly: number;
  platformFees: number;
  netOnPlatform: number;
  netOnTutorLingua: number;
  tutorLinguaCost: number;
  monthlySavings: number;
  annualSavings: number;
  commissionRate: number;
  platformData: PlatformCommission;
};

function calculateEarnings(state: CalculatorState): EarningsResult {
  const platformData = PLATFORM_COMMISSIONS[state.platform] || PLATFORM_COMMISSIONS.other;
  const hoursPerMonth = (state.lessonsPerMonth * state.lessonDuration) / 60;
  const grossMonthly = hoursPerMonth * state.hourlyRate;

  const effectiveRate = platformData.rate;

  const tutorLinguaCost = TUTORLINGUA_MONTHLY_COST;

  // Special handling for Cambly (fixed hourly rate)
  if (state.platform === "cambly") {
    const camblyHourlyRate = 10.2;
    const camblyEarnings = hoursPerMonth * camblyHourlyRate;
    const platformFees = grossMonthly - camblyEarnings;
    const netOnTutorLingua = grossMonthly - tutorLinguaCost;
    const monthlySavings = netOnTutorLingua - camblyEarnings;
    return {
      grossMonthly,
      platformFees: Math.max(0, platformFees),
      netOnPlatform: camblyEarnings,
      netOnTutorLingua,
      tutorLinguaCost,
      monthlySavings: Math.max(0, monthlySavings),
      annualSavings: Math.max(0, monthlySavings * 12),
      commissionRate: Math.max(0, platformFees / grossMonthly),
      platformData,
    };
  }

  const platformFees = grossMonthly * effectiveRate;
  const netOnPlatform = grossMonthly - platformFees;
  const netOnTutorLingua = grossMonthly - tutorLinguaCost; // After subscription cost
  const monthlySavings = netOnTutorLingua - netOnPlatform;
  const annualSavings = monthlySavings * 12;

  return {
    grossMonthly,
    platformFees,
    netOnPlatform,
    netOnTutorLingua,
    tutorLinguaCost,
    monthlySavings,
    annualSavings,
    commissionRate: effectiveRate,
    platformData,
  };
}

export function EarningsCalculator() {
  const [state, setState] = React.useState<CalculatorState>({
    platform: "preply",
    hourlyRate: 30,
    lessonsPerMonth: 40,
    currency: "USD",
    lessonDuration: 60,
  });

  const results = calculateEarnings(state);

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Main Card */}
      <div className="rounded-[2.5rem] bg-white shadow-2xl shadow-black/5 overflow-hidden border border-border/40">
        <div className="grid lg:grid-cols-12 min-h-[600px]">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-5 bg-muted/30 p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-border/40 flex flex-col justify-between relative">
            
            <div className="space-y-10">
              <div className="flex items-center justify-end">
                <div className="w-28">
                  <Select
                    value={state.currency}
                    onValueChange={(value) => setState((s) => ({ ...s, currency: value }))}
                  >
                    <SelectTrigger className="h-9 text-sm font-medium bg-white border border-border shadow-sm rounded-lg px-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code} className="text-xs">
                          {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-8">
                {/* Platform */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Platform</label>
                  <Select
                    value={state.platform}
                    onValueChange={(value) => setState((s) => ({ ...s, platform: value }))}
                  >
                    <SelectTrigger className="h-12 bg-white border-border/60 text-base shadow-sm rounded-xl">
                      <span>{PLATFORM_COMMISSIONS[state.platform]?.name || "Select platform"}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLATFORM_COMMISSIONS)
                        .filter(([key]) => key !== "tutorlingua")
                        .map(([key, data]) => (
                          <SelectItem key={key} value={key}>
                            {data.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hourly Rate */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Hourly Rate</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 font-medium text-lg group-focus-within:text-primary transition-colors">
                      {SUPPORTED_CURRENCIES.find((c) => c.code === state.currency)?.symbol || "$"}
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      value={state.hourlyRate}
                      onChange={(e) =>
                        setState((s) => ({ ...s, hourlyRate: Number(e.target.value) || 0 }))
                      }
                      className="pl-10 h-14 text-2xl font-bold bg-white border-border/60 shadow-sm rounded-xl focus-visible:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                {/* Lessons Per Month */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Lessons / Month</label>
                    <span className="text-lg font-bold text-foreground font-mono bg-white px-3 py-1 rounded-lg border border-border/40 shadow-sm">
                      {state.lessonsPerMonth}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    step={1}
                    value={state.lessonsPerMonth}
                    onChange={(e) =>
                      setState((s) => ({ ...s, lessonsPerMonth: Number(e.target.value) }))
                    }
                    className="w-full h-2 bg-black/5 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Duration</label>
                  <div className="grid grid-cols-4 gap-2 bg-black/5 p-1 rounded-xl">
                    {[30, 45, 60, 90].map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setState((s) => ({ ...s, lessonDuration: duration }))}
                        className={cn(
                          "py-2 text-sm font-semibold rounded-[0.6rem] transition-all",
                          state.lessonDuration === duration
                            ? "bg-white text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {duration}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-black/5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                   Calculations based on standard commission rates. Results may vary based on specific platform tier or grandfathered rates.
                </p>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-white relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="relative z-10 space-y-12">
              
              {/* Main Savings */}
              <div className="text-center lg:text-left space-y-2">
                <h2 className="text-lg font-medium text-muted-foreground">Potential Annual Savings</h2>
                <div className="flex items-baseline justify-center lg:justify-start gap-2">
                  <AnimatePresence mode="wait">
                    <motion.span 
                      key={results.annualSavings}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-6xl sm:text-7xl font-bold tracking-tight text-primary"
                    >
                      {formatCurrency(results.annualSavings, state.currency)}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <p className="text-foreground/60 text-lg">
                  extra per year (after TutorLingua&apos;s {formatCurrency(TUTORLINGUA_MONTHLY_COST, state.currency)}/mo subscription)
                </p>
              </div>

              {/* Visual Breakdown */}
              <div className="space-y-6">
                 {/* Platform Bar */}
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            {results.platformData.name}
                        </span>
                        <span className="text-foreground/60">
                             {formatCurrency(results.netOnPlatform, state.currency)} net
                        </span>
                    </div>
                    <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
                        <div 
                           className="h-full bg-foreground/80" 
                           style={{ width: `${(results.netOnPlatform / results.grossMonthly) * 100}%` }} 
                        />
                        <div 
                           className="h-full bg-red-400" 
                           style={{ width: `${(results.platformFees / results.grossMonthly) * 100}%` }} 
                        />
                    </div>
                     <div className="flex justify-end text-xs text-red-500 font-medium">
                        -{formatCurrency(results.platformFees, state.currency)} fees
                     </div>
                 </div>

                 {/* TutorLingua Bar */}
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            TutorLingua
                        </span>
                        <span className="text-primary font-bold">
                             {formatCurrency(results.netOnTutorLingua, state.currency)} net
                        </span>
                    </div>
                    <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
                        <div
                           className="h-full bg-primary"
                           style={{ width: `${(results.netOnTutorLingua / results.grossMonthly) * 100}%` }}
                        />
                        <div
                           className="h-full bg-amber-400"
                           style={{ width: `${(results.tutorLinguaCost / results.grossMonthly) * 100}%` }}
                        />
                    </div>
                     <div className="flex justify-end text-xs text-amber-600 font-medium">
                        -{formatCurrency(results.tutorLinguaCost, state.currency)}/mo subscription
                     </div>
                 </div>
              </div>

              {/* Action */}
              <div className="pt-4">
                <Link
                  href="https://tutorlingua.co/signup"
                  className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-primary px-8 py-4 font-semibold text-white transition-all duration-300 hover:bg-primary/90 hover:scale-[1.01] shadow-lg shadow-primary/20"
                >
                    <span className="mr-2 text-lg">Start Keeping 100%</span>
                    <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </Link>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Free 14-day trial · No credit card required · Cancel anytime
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Simplified Comparison Table */}
      <div className="mt-12 text-center">
        <button 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
            onClick={() => {
                const el = document.getElementById('commission-details');
                if (el) el.classList.toggle('hidden');
            }}
        >
            View detailed commission rates
            <svg className="w-4 h-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>

        <div id="commission-details" className="hidden mt-8 bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm text-left animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Platform</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Commission Structure</th>
                  <th className="text-right py-4 px-6 font-semibold text-foreground">
                    Take Home ({formatCurrency(state.hourlyRate, state.currency)}/hr)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {Object.entries(PLATFORM_COMMISSIONS).map(([key, data]) => {
                  let youKeep = state.hourlyRate * (1 - data.rate);
                  if (key === "cambly") youKeep = 10.2;
                  const isTutorLingua = key === "tutorlingua";
                  
                  return (
                    <tr key={key} className={cn("hover:bg-muted/10 transition-colors", isTutorLingua && "bg-primary/5")}>
                      <td className="py-4 px-6 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                            {data.name}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{data.note}</td>
                      <td className={cn("py-4 px-6 text-right font-mono font-medium", isTutorLingua ? "text-primary" : "text-foreground")}>
                        {formatCurrency(youKeep, state.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
