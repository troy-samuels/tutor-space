"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEADLINE = "2025-12-31T23:59:59";

function useCountdown(deadlineIso: string) {
  const deadlineMs = useMemo(() => new Date(deadlineIso).getTime(), [deadlineIso]);
  const [remainingMs, setRemainingMs] = useState(() => Math.max(deadlineMs - Date.now(), 0));

  useEffect(() => {
    const update = () => setRemainingMs(Math.max(deadlineMs - Date.now(), 0));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadlineMs]);

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { remainingMs, days, hours, minutes, seconds };
}

interface LifetimeCTAProps {
  onCheckout: () => void;
  isLoading: boolean;
}

export function LifetimeCTA({ onCheckout, isLoading }: LifetimeCTAProps) {
  const { remainingMs, days, hours, minutes, seconds } = useCountdown(DEADLINE);
  const isExpired = remainingMs <= 0;

  if (isExpired) {
    return null;
  }

  return (
    <section className="bg-gradient-to-b from-brand-white to-primary/5 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-xl sm:p-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Don&apos;t Miss This Opportunity
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Lock in lifetime access before the offer expires.
            </p>

            {/* Countdown */}
            <div className="mt-8 flex items-center justify-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-primary">
                {days}d {hours}h {minutes}m {seconds}s remaining
              </span>
            </div>

            {/* Price */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className="text-xl text-gray-500 line-through">$29/month</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-foreground">$99</span>
                <span className="text-lg text-gray-600">one-time</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8">
              <Button
                onClick={onCheckout}
                disabled={isLoading}
                size="lg"
                className="h-14 px-12 text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
              >
                {isLoading ? (
                  "Redirecting to checkout..."
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Get Lifetime Access Now
                  </>
                )}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Secure payment</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span>14-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                </svg>
                <span>0% platform fees</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
