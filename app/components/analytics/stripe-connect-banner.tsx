"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";

export function StripeConnectBanner() {
  return (
    <div className="flex justify-center">
      <Link
        href="/settings/payments"
        className="group inline-flex items-center gap-3 rounded-2xl border border-border/50 bg-white/60 px-4 py-2.5 backdrop-blur transition-all hover:bg-white/80 hover:shadow-sm"
      >
        <div className="rounded-lg border border-primary/15 bg-primary/10 p-1.5 text-primary">
          <TrendingUp className="h-4 w-4" />
        </div>
        <span className="text-sm text-muted-foreground">
          See your revenue
        </span>
        <span className="text-sm font-medium text-primary group-hover:underline">
          Connect Stripe
        </span>
      </Link>
    </div>
  );
}
