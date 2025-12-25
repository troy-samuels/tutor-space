"use client";

import Link from "next/link";
import { Package, AlertTriangle, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StudentPackageCredit } from "@/lib/actions/student-bookings";

type PackageCardProps = {
  pkg: StudentPackageCredit;
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function PackageCard({ pkg }: PackageCardProps) {
  const usedMinutes = pkg.totalMinutes - pkg.remainingMinutes;
  const usagePercent = Math.round((pkg.remainingMinutes / pkg.totalMinutes) * 100);
  const daysUntilExpiry = getDaysUntilExpiry(pkg.expiresAt);
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;

  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Tutor avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={pkg.tutorAvatar || undefined} alt={pkg.tutorName} />
          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
            {getInitials(pkg.tutorName)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">{pkg.tutorName}</p>
              <p className="text-sm text-muted-foreground">{pkg.packageName}</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Package className="h-4 w-4" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">
                {formatMinutes(pkg.remainingMinutes)} of {formatMinutes(pkg.totalMinutes)} remaining
              </span>
              <span className="font-medium text-foreground">{usagePercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  usagePercent > 50
                    ? "bg-emerald-500"
                    : usagePercent > 20
                      ? "bg-yellow-500"
                      : "bg-red-500"
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          {/* Expiry and actions */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isExpiringSoon ? (
                <Badge
                  variant="outline"
                  className="border-yellow-300 bg-yellow-50 text-yellow-700 gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}
                </Badge>
              ) : pkg.expiresAt ? (
                <span className="text-xs text-muted-foreground">
                  Expires{" "}
                  {new Date(pkg.expiresAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No expiration</span>
              )}
            </div>

            <Link
              href={`/student/book?tutor=${pkg.tutorId}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Book Now
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
