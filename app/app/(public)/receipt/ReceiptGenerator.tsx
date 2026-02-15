"use client";

import * as React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  PLATFORM_COMMISSIONS,
  SUPPORTED_CURRENCIES,
} from "@/lib/constants/commission-rates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ReceiptState = {
  platform: string;
  hourlyRate: number;
  hoursPerWeek: number;
  monthsOnPlatform: number;
  currency: string;
};

type ReceiptData = {
  totalLessonHours: number;
  grossEarnings: number;
  totalCommission: number;
  netEarnings: number;
  effectiveHourlyRate: number;
  commissionRate: number;
  dailyCommission: number;
  platformName: string;
};

function calculateReceipt(state: ReceiptState): ReceiptData {
  const platform = PLATFORM_COMMISSIONS[state.platform] || PLATFORM_COMMISSIONS.other;
  const totalWeeks = state.monthsOnPlatform * 4.33;
  const totalLessonHours = totalWeeks * state.hoursPerWeek;
  const grossEarnings = totalLessonHours * state.hourlyRate;

  let totalCommission: number;
  let netEarnings: number;

  if (state.platform === "cambly") {
    const camblyRate = 10.2;
    netEarnings = totalLessonHours * camblyRate;
    totalCommission = grossEarnings - netEarnings;
  } else if (state.platform === "preply") {
    // Preply: 33% first 20 hours, then 25% next 150 hours, then 18%
    const first20 = Math.min(totalLessonHours, 20);
    const next150 = Math.min(Math.max(totalLessonHours - 20, 0), 150);
    const remaining = Math.max(totalLessonHours - 170, 0);
    totalCommission =
      first20 * state.hourlyRate * 0.33 +
      next150 * state.hourlyRate * 0.25 +
      remaining * state.hourlyRate * 0.18;
    netEarnings = grossEarnings - totalCommission;
  } else {
    totalCommission = grossEarnings * platform.rate;
    netEarnings = grossEarnings - totalCommission;
  }

  const effectiveHourlyRate = totalLessonHours > 0 ? netEarnings / totalLessonHours : 0;
  const commissionRate = grossEarnings > 0 ? totalCommission / grossEarnings : 0;
  const totalDays = state.monthsOnPlatform * 30.44;
  const dailyCommission = totalDays > 0 ? totalCommission / totalDays : 0;

  return {
    totalLessonHours: Math.round(totalLessonHours),
    grossEarnings,
    totalCommission,
    netEarnings,
    effectiveHourlyRate,
    commissionRate,
    dailyCommission,
    platformName: platform.name,
  };
}

function formatCurrency(amount: number, currency: string): string {
  const currencyData = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
  const symbol = currencyData?.symbol || "$";
  if (currency === "JPY" || currency === "KRW") {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatWhole(amount: number, currency: string): string {
  const currencyData = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
  const symbol = currencyData?.symbol || "$";
  if (currency === "JPY" || currency === "KRW") {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

export function ReceiptGenerator() {
  const [state, setState] = React.useState<ReceiptState>({
    platform: "preply",
    hourlyRate: 25,
    hoursPerWeek: 15,
    monthsOnPlatform: 12,
    currency: "USD",
  });
  const [showReceipt, setShowReceipt] = React.useState(false);
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const receipt = calculateReceipt(state);

  const handleGenerate = () => {
    setShowReceipt(true);
    setTimeout(() => {
      receiptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleShare = async () => {
    const text = `I've paid ${formatWhole(receipt.totalCommission, state.currency)} in commission to ${receipt.platformName} over ${state.monthsOnPlatform} months of teaching.\n\nThat's ${formatCurrency(receipt.dailyCommission, state.currency)} per day — just for being on a platform.\n\nMy real hourly rate? ${formatCurrency(receipt.effectiveHourlyRate, state.currency)}/hr (not the ${formatCurrency(state.hourlyRate, state.currency)}/hr I set).\n\nGenerate your receipt → tutorlingua.co/receipt`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "My Platform Receipt", text });
        return;
      } catch {
        // fallthrough to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="wordmark" className="h-6 invert" />
          </Link>
          <Link
            href="/calculator"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Full Calculator →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-14 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-4 font-heading text-4xl leading-tight text-foreground md:text-5xl">
            Your Platform Receipt
          </h1>
          <p className="text-lg text-muted-foreground">
            See exactly how much you&apos;ve paid in commission.
            <br />
            The number might surprise you.
          </p>
        </div>
      </section>

      {/* Input Form */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-border/50 bg-card p-6">
          {/* Platform */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Platform
            </label>
            <Select
              value={state.platform}
              onValueChange={(v) => setState((s) => ({ ...s, platform: v }))}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
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

          {/* Currency + Rate */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Currency
              </label>
              <Select
                value={state.currency}
                onValueChange={(v) => setState((s) => ({ ...s, currency: v }))}
              >
                <SelectTrigger className="h-11 rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="text-xs">
                      {c.code} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Hourly Rate
              </label>
              <Input
                type="number"
                min={1}
                max={500}
                value={state.hourlyRate}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    hourlyRate: Number(e.target.value) || 0,
                  }))
                }
                className="h-11 rounded-xl text-lg font-semibold"
              />
            </div>
          </div>

          {/* Hours per week */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Teaching Hours per Week
              </label>
              <span className="font-mono text-sm font-bold">{state.hoursPerWeek}</span>
            </div>
            <input
              type="range"
              min={1}
              max={40}
              value={state.hoursPerWeek}
              onChange={(e) =>
                setState((s) => ({ ...s, hoursPerWeek: Number(e.target.value) }))
              }
              className="w-full accent-primary"
            />
          </div>

          {/* Months on platform */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Months on Platform
              </label>
              <span className="font-mono text-sm font-bold">
                {state.monthsOnPlatform} {state.monthsOnPlatform === 1 ? "month" : "months"}
                {state.monthsOnPlatform >= 12 && (
                  <span className="ml-1 text-muted-foreground">
                    ({(state.monthsOnPlatform / 12).toFixed(1)} yr)
                  </span>
                )}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              value={state.monthsOnPlatform}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  monthsOnPlatform: Number(e.target.value),
                }))
              }
              className="w-full accent-primary"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            className="w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-background transition-all hover:opacity-90"
          >
            Generate My Receipt
          </button>
        </div>
      </section>

      {/* Receipt */}
      {showReceipt && (
        <section className="px-6 pb-16">
          <div
            ref={receiptRef}
            className="mx-auto max-w-sm"
          >
            {/* Receipt Card */}
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-white shadow-2xl shadow-black/10">
              {/* Header */}
              <div className="border-b border-dashed border-border/60 px-6 py-5 text-center">
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Commission Receipt
                </p>
                <p className="font-heading text-xl font-bold text-foreground">
                  {receipt.platformName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {state.monthsOnPlatform} month{state.monthsOnPlatform !== 1 ? "s" : ""} of teaching
                </p>
              </div>

              {/* Line Items */}
              <div className="space-y-0 px-6 py-5">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Teaching hours</span>
                  <span className="font-mono text-sm font-medium text-foreground">
                    {receipt.totalLessonHours.toLocaleString()} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Listed rate</span>
                  <span className="font-mono text-sm font-medium text-foreground">
                    {formatCurrency(state.hourlyRate, state.currency)}/hr
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Gross earnings</span>
                  <span className="font-mono text-sm font-medium text-foreground">
                    {formatWhole(receipt.grossEarnings, state.currency)}
                  </span>
                </div>

                <div className="my-3 border-t border-dashed border-border/60" />

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-red-600">
                    Platform commission ({(receipt.commissionRate * 100).toFixed(0)}%)
                  </span>
                  <span className="font-mono text-sm font-bold text-red-600">
                    −{formatWhole(receipt.totalCommission, state.currency)}
                  </span>
                </div>

                <div className="my-3 border-t border-dashed border-border/60" />

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">You received</span>
                  <span className="font-mono text-sm font-medium text-foreground">
                    {formatWhole(receipt.netEarnings, state.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Your real hourly rate</span>
                  <span className="font-mono text-sm font-medium text-foreground">
                    {formatCurrency(receipt.effectiveHourlyRate, state.currency)}/hr
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-dashed border-border/60 bg-red-50 px-6 py-5 text-center">
                <p className="mb-1 text-xs uppercase tracking-wider text-red-600/70">
                  Total paid to {receipt.platformName}
                </p>
                <p className="font-heading text-4xl font-bold text-red-600">
                  {formatWhole(receipt.totalCommission, state.currency)}
                </p>
                <p className="mt-2 text-xs text-red-600/60">
                  That&apos;s {formatCurrency(receipt.dailyCommission, state.currency)} per day
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
                  Generated at tutorlingua.co/receipt
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleShare}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-semibold text-background transition-all hover:opacity-90"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share Your Receipt
              </button>
              <Link
                href="/calculator"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-card"
              >
                See Monthly Savings →
              </Link>
              <Link
                href="/profile-analyser"
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
                  "bg-primary text-white hover:brightness-110"
                )}
              >
                Start Keeping 100% — Try Free
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Social proof / context */}
      <section className="border-t border-border/50 px-6 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 font-heading text-xl text-foreground">
            You&apos;re not alone
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Thousands of tutors are realising what platform commission really costs them.
          </p>
          <div className="grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <p className="text-sm italic text-foreground/80">
                &ldquo;I added it up. Over 3.5 years, Preply took $9,300 from me.
                That&apos;s a part-time tutor.&rdquo;
              </p>
              <p className="mt-2 text-xs text-muted-foreground">— r/Preply</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <p className="text-sm italic text-foreground/80">
                &ldquo;15% doesn&apos;t sound like much until you do 100 hours a month.
                That&apos;s 15 hours of work going straight to the platform.&rdquo;
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                — r/OnlineESLTeaching
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Other tools */}
      <section className="border-t border-border/50 px-6 py-8">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-3">
          <span className="text-xs text-muted-foreground">More tools:</span>
          <Link
            href="/calculator"
            className="rounded-lg border border-border/50 px-3 py-1.5 text-xs text-foreground transition-all hover:bg-card"
          >
            Earnings Calculator
          </Link>
          <Link
            href="/profile-analyser"
            className="rounded-lg border border-border/50 px-3 py-1.5 text-xs text-foreground transition-all hover:bg-card"
          >
            Profile Analyser
          </Link>
          <Link
            href="/recap"
            className="rounded-lg border border-border/50 px-3 py-1.5 text-xs text-foreground transition-all hover:bg-card"
          >
            Lesson Recaps
          </Link>
          <Link
            href="/compare/preply"
            className="rounded-lg border border-border/50 px-3 py-1.5 text-xs text-foreground transition-all hover:bg-card"
          >
            vs Preply
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Logo variant="wordmark" className="h-4 opacity-40 invert" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TutorLingua
          </p>
        </div>
      </footer>
    </div>
  );
}
