"use client";

import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StripeConnectBanner() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">See your revenue</h3>
            <p className="text-sm text-blue-700">
              Connect Stripe to view earnings and payout analytics
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
        >
          <Link href="/settings/payments">
            Connect
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
