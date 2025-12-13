"use client";

import {
  DollarSign,
  CheckCircle,
  RotateCcw,
  Clock,
  CalendarDays,
  ExternalLink,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { StripePaymentRecord, StripePaymentStatus } from "@/lib/types/stripe-payments";

type StudentPaymentsTabProps = {
  totalPaidCents: number;
  totalRefundedCents: number;
  currency: string;
  payments: StripePaymentRecord[];
  source: "stripe" | "audit";
};

const statusConfig: Record<
  StripePaymentStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  succeeded: {
    label: "Paid",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  pending: {
    label: "Pending",
    className: "border-amber-300 bg-amber-50 text-amber-700",
    icon: <Clock className="h-3 w-3" />,
  },
  failed: {
    label: "Failed",
    className: "border-red-300 bg-red-50 text-red-700",
    icon: <XCircle className="h-3 w-3" />,
  },
  refunded: {
    label: "Refunded",
    className: "border-gray-300 bg-gray-50 text-gray-700",
    icon: <RotateCcw className="h-3 w-3" />,
  },
  partially_refunded: {
    label: "Partial Refund",
    className: "border-orange-300 bg-orange-50 text-orange-700",
    icon: <RotateCcw className="h-3 w-3" />,
  },
};

export function StudentPaymentsTab({
  totalPaidCents,
  totalRefundedCents,
  currency,
  payments,
  source,
}: StudentPaymentsTabProps) {
  const successfulPayments = payments.filter(
    (p) => p.status === "succeeded" || p.status === "partially_refunded"
  );
  const lastPayment = successfulPayments[0];

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      {source === "audit" && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <span>
            Connect Stripe to see live payment data with receipt links.
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            Total Paid
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(totalPaidCents, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {successfulPayments.length} payment
            {successfulPayments.length !== 1 ? "s" : ""} received
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <RotateCcw
              className={`h-4 w-4 ${
                totalRefundedCents > 0 ? "text-orange-500" : "text-gray-400"
              }`}
            />
            Refunded
          </div>
          <p
            className={`text-2xl font-bold ${
              totalRefundedCents > 0 ? "text-orange-600" : "text-muted-foreground"
            }`}
          >
            {totalRefundedCents > 0
              ? formatCurrency(totalRefundedCents, currency)
              : "None"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalRefundedCents > 0
              ? `${payments.filter((p) => p.refundedAmount > 0).length} refund(s) issued`
              : "No refunds issued"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            Last Payment
          </div>
          <p className="text-2xl font-bold text-foreground">
            {lastPayment
              ? formatCurrency(
                  lastPayment.amount - lastPayment.refundedAmount,
                  lastPayment.currency
                )
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {lastPayment ? formatDate(lastPayment.created.toISOString()) : "No payments yet"}
          </p>
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Payment History
        </h3>

        {payments.length > 0 ? (
          <div className="space-y-3">
            {payments.slice(0, 15).map((payment) => {
              const config = statusConfig[payment.status];
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        payment.status === "succeeded"
                          ? "bg-emerald-100 text-emerald-600"
                          : payment.status === "refunded"
                          ? "bg-gray-100 text-gray-600"
                          : payment.status === "failed"
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {payment.description || "Payment"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(payment.created.toISOString())}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      {payment.refundedAmount > 0 && (
                        <p className="text-xs text-orange-600">
                          -{formatCurrency(payment.refundedAmount, payment.currency)}{" "}
                          refunded
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${config.className}`}
                      >
                        {config.label}
                      </Badge>
                      {payment.receiptUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          asChild
                        >
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View receipt"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No payment history yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Payments will appear here after booking lessons
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
