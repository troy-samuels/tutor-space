"use client";

import { Users, Share2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReferralStats = {
  /** Number of tutors referred by this tutor. */
  tutorsReferred: number;
  /** Total students across referred tutors. */
  networkStudents: number;
  /** Whether the referral programme is active. */
  isActive: boolean;
};

type ReferralNetworkProps = {
  stats?: ReferralStats;
  referralLink?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Tutor referral network widget for the dashboard.
 * Shows referral stats and provides sharing tools.
 */
export function ReferralNetwork({
  stats = { tutorsReferred: 0, networkStudents: 0, isActive: true },
  referralLink,
}: ReferralNetworkProps) {
  const hasReferrals = stats.tutorsReferred > 0;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Your Network</h2>
      </div>

      {hasReferrals ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl bg-primary/5 p-4 text-centre">
              <p className="text-2xl font-bold text-primary">{stats.tutorsReferred}</p>
              <p className="text-xs text-muted-foreground">Tutors referred</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 text-centre">
              <p className="text-2xl font-bold text-emerald-600">{stats.networkStudents}</p>
              <p className="text-xs text-muted-foreground">Network students</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>Your referrals are bringing in students. Keep growing your network.</span>
          </div>
        </>
      ) : (
        <div className="py-4 text-centre">
          <p className="text-sm text-muted-foreground">
            Know other language tutors? Refer them and build your network.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Earn rewards for every tutor who joins through your link.
          </p>
        </div>
      )}

      {referralLink && (
        <Link
          href="/marketing/referrals"
          className={cn(
            "mt-4 flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors",
            hasReferrals
              ? "border border-border text-foreground hover:bg-muted"
              : "bg-primary text-white shadow-sm hover:bg-primary/90"
          )}
        >
          <Share2 className="h-4 w-4" />
          {hasReferrals ? "Share your link" : "Start referring"}
        </Link>
      )}
    </div>
  );
}
