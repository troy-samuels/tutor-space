"use client";

import Link from "next/link";
import { AlertTriangle, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StripeBalanceData } from "@/lib/types/analytics-premium";

interface FinancialHealthCardProps {
  data: StripeBalanceData | null;
  isLoading?: boolean;
}

export function FinancialHealthCard({
  data,
  isLoading,
}: FinancialHealthCardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-[24px] border border-border/50 bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted/30" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted/30" />
        </div>
        <CardContent className="mt-0 grid grid-cols-2 divide-x divide-border/60 p-0">
          <div className="p-6">
            <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
            <div className="mt-3 h-8 w-24 animate-pulse rounded bg-muted/40" />
          </div>
          <div className="p-6">
            <div className="h-3 w-16 animate-pulse rounded bg-muted/40" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted/40" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state - Stripe not connected
  if (!data) {
    return (
      <Card className="rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-sm font-semibold tracking-tight text-muted-foreground">
              Stripe balance
            </p>
            <p className="text-xs text-muted-foreground/80">
              Connect Stripe to unlock payouts
            </p>
          </div>
          <div className="rounded-xl border border-primary/15 bg-primary/10 p-2.5 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <CardContent className="mt-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <div className="rounded-full bg-muted/60 p-3">
            <Wallet className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Connect Stripe to see your payouts
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/settings/payments">Connect Stripe</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  return (
    <Card
      className={cn(
        "rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-lg backdrop-blur",
        data.requiresAction && "border-l-4 border-l-orange-400"
      )}
    >
      {data.requiresAction && (
        <div className="flex items-center gap-2 border-b border-border/60 bg-orange-50/50 px-5 py-2.5">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-medium text-orange-700">
            Finish Stripe setup to get paid
          </span>
          <Link
            href="/settings/payments"
            className="ml-auto text-xs font-medium text-orange-600 hover:underline"
          >
            View
          </Link>
        </div>
      )}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-sm font-semibold tracking-tight text-muted-foreground">
            Stripe balance
          </p>
          <p className="text-xs text-muted-foreground/80">
            Payout ready & processing
          </p>
        </div>
        <div className="rounded-xl border border-primary/15 bg-primary/10 p-2.5 text-primary">
          <Wallet className="h-5 w-5" />
        </div>
      </div>
      <CardContent className="mt-0 grid grid-cols-2 divide-x divide-border/60 p-0">
        {/* Available Balance */}
        <div className="flex flex-col gap-2 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Ready to withdraw
          </p>
          <p className="text-3xl font-semibold tracking-tight text-primary">
            {formatCurrency(data.availableCents, data.currency)}
          </p>
          <p className="text-xs text-primary/80">Available to transfer</p>
        </div>

        {/* Pending Balance */}
        <div className="flex flex-col gap-2 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Processing
          </p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {formatCurrency(data.pendingCents, data.currency)}
          </p>
          <p className="text-xs text-muted-foreground/80">Expected soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
