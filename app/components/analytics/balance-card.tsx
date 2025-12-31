"use client";

import { AlertTriangle, Wallet } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StripeBalanceData } from "@/lib/types/analytics-premium";

interface BalanceCardProps {
  data: StripeBalanceData | null;
  isLoading?: boolean;
}

export function BalanceCard({ data, isLoading }: BalanceCardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-3 w-20 animate-pulse rounded bg-muted/40" />
              <div className="h-8 w-24 animate-pulse rounded bg-muted/40" />
              <div className="h-3 w-28 animate-pulse rounded bg-muted/30" />
            </div>
            <div className="h-10 w-10 animate-pulse rounded-xl bg-muted/30" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't render if Stripe not connected
  if (!data) {
    return null;
  }

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <Card
      className={cn(
        "rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur transition-shadow hover:shadow-lg",
        data.requiresAction && "border-l-4 border-l-orange-400"
      )}
    >
      {data.requiresAction && (
        <div className="flex items-center gap-2 border-b border-border/50 bg-orange-50/50 px-5 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-xs font-medium text-orange-700">
            Action needed
          </span>
          <Link
            href="/settings/payments"
            className="ml-auto text-xs font-medium text-orange-600 hover:underline"
          >
            View
          </Link>
        </div>
      )}
      <CardContent className={cn("p-5", data.requiresAction && "pt-4")}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Balance
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {formatCurrency(data.availableCents, data.currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {formatCurrency(data.pendingCents, data.currency)}
              </span>{" "}
              pending
            </p>
          </div>
          <div className="rounded-xl border border-primary/15 bg-primary/10 p-2.5 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
