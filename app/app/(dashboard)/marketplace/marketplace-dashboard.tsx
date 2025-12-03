"use client";

import { DollarSign, TrendingUp, Percent, ShoppingBag, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

type Transaction = {
  id: string;
  gross_amount_cents: number;
  platform_commission_cents: number;
  net_amount_cents: number;
  commission_rate: number;
  status: string;
  created_at: string;
  products?: {
    id: string;
    title: string;
    slug: string;
    category: string;
  }[];
};

type Summary = {
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  transactionCount: number;
};

type Props = {
  transactions: Transaction[];
  summary: Summary;
  commissionTier: "standard" | "reduced";
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MarketplaceDashboard({ transactions, summary, commissionTier }: Props) {
  const progressToReducedRate = Math.min(100, (summary.totalGross / 50000) * 100);
  const amountToReducedRate = Math.max(0, 50000 - summary.totalGross);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track your digital product sales and commission breakdown
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Gross Revenue</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(summary.totalGross)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Your Earnings</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(summary.totalNet)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Percent className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Platform Fee</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(summary.totalCommission)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <ShoppingBag className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Sales</p>
              <p className="text-xl font-bold text-foreground">{summary.transactionCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Tier Card */}
      <div className="rounded-xl border border-border/50 bg-gradient-to-br from-white to-muted/20 p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Commission Tier</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {commissionTier === "reduced" ? (
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  You&apos;ve unlocked the reduced 10% rate!
                </span>
              ) : (
                <>
                  Reach $500 in sales to unlock 10% commission (currently 15%)
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-foreground">
              {commissionTier === "reduced" ? "10%" : "15%"}
            </span>
            <p className="text-xs text-muted-foreground">current rate</p>
          </div>
        </div>

        {commissionTier === "standard" && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress to 10% rate</span>
              <span>{formatCurrency(amountToReducedRate)} to go</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressToReducedRate}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl border border-border/50 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h3 className="font-semibold text-foreground">Recent Sales</h3>
          <Link
            href="/digital-products"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Manage Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">No sales yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create and publish digital products to start earning
            </p>
            <Link
              href="/digital-products"
              className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Product
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Gross</th>
                  <th className="px-5 py-3 text-right">Fee</th>
              <th className="px-5 py-3 text-right">Your Earnings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {transactions.map((tx) => {
              const primaryProduct = tx.products?.[0];

              return (
                <tr key={tx.id} className="text-sm">
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {primaryProduct?.title || "Unknown Product"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {primaryProduct?.category || "product"}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatDate(tx.created_at)}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-foreground">
                    {formatCurrency(tx.gross_amount_cents)}
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">
                    {formatCurrency(tx.platform_commission_cents)}
                    <span className="ml-1 text-xs">
                      ({(tx.commission_rate * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-emerald-600">
                    {formatCurrency(tx.net_amount_cents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        )}
      </div>
    </div>
  );
}
