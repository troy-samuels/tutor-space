"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEADLINE = "2025-12-03T23:59:59";

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

interface LifetimeHeroProps {
  onCheckout: () => void;
  isLoading: boolean;
}

export function LifetimeHero({ onCheckout, isLoading }: LifetimeHeroProps) {
  const { remainingMs, days, hours, minutes, seconds } = useCountdown(DEADLINE);
  const isExpired = remainingMs <= 0;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-brand-white to-brand-white py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Limited time badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Clock className="h-4 w-4" />
            <span>Limited Time Launch Offer</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            <span className="block">Get TutorLingua</span>
            <span className="block text-primary">For Life</span>
          </h1>

          {/* Price */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className="text-2xl text-gray-500 line-through">$29/month</span>
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-bold text-foreground">$99</span>
              <span className="text-xl text-gray-600">one-time</span>
            </div>
          </div>

          <p className="mt-6 text-lg leading-8 text-gray-700 sm:text-xl">
            Pay once, own it forever. No monthly fees. No hidden costs.
            <br />
            Full access to every feature, for as long as TutorLingua exists.
          </p>

          {/* Countdown timer */}
          {!isExpired && (
            <div className="mt-10">
              <p className="mb-4 text-sm font-medium text-gray-600">Offer ends in:</p>
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <CountdownBlock value={days} label="Days" />
                <span className="text-3xl font-bold text-primary">:</span>
                <CountdownBlock value={hours} label="Hours" />
                <span className="text-3xl font-bold text-primary">:</span>
                <CountdownBlock value={minutes} label="Minutes" />
                <span className="text-3xl font-bold text-primary">:</span>
                <CountdownBlock value={seconds} label="Seconds" />
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-10">
            {isExpired ? (
              <div className="rounded-lg bg-muted p-6">
                <p className="text-lg font-semibold text-gray-700">
                  This offer has expired.
                </p>
                <p className="mt-2 text-gray-600">
                  Check out our regular pricing at{" "}
                  <Link href="/" className="text-primary hover:underline">
                    tutorlingua.co
                  </Link>
                </p>
              </div>
            ) : (
              <Button
                onClick={onCheckout}
                disabled={isLoading}
                size="lg"
                className="h-14 px-10 text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
              >
                {isLoading ? (
                  "Redirecting to checkout..."
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Get Lifetime Access for $99
                  </>
                )}
              </Button>
            )}
            {!isExpired && (
              <p className="mt-4 text-sm text-gray-500">
                Secure checkout powered by Stripe
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Decorative background */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-white opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
    </section>
  );
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 sm:h-20 sm:w-20">
        <span className="text-2xl font-bold text-primary sm:text-3xl">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-xs font-medium text-gray-500 sm:text-sm">{label}</span>
    </div>
  );
}
