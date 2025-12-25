"use client";

import Link from "next/link";
import { CreditCard, ArrowRight, Pause } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StudentSubscriptionCredit } from "@/lib/actions/student-bookings";

type SubscriptionCardProps = {
  subscription: StudentSubscriptionCredit;
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

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const usagePercent =
    subscription.lessonsPerMonth > 0
      ? Math.round((subscription.lessonsAvailable / subscription.lessonsPerMonth) * 100)
      : 0;

  const isPaused = subscription.status === "paused";
  const isTrialing = subscription.status === "trialing";

  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Tutor avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={subscription.tutorAvatar || undefined} alt={subscription.tutorName} />
          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
            {getInitials(subscription.tutorName)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">{subscription.tutorName}</p>
              <p className="text-sm text-muted-foreground">
                {subscription.serviceName} ({subscription.lessonsPerMonth} lessons/month)
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {isPaused ? (
                <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700 gap-1">
                  <Pause className="h-3 w-3" />
                  Paused
                </Badge>
              ) : isTrialing ? (
                <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
                  Trial
                </Badge>
              ) : (
                <CreditCard className="h-4 w-4 text-blue-600" />
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">
                {subscription.lessonsAvailable} of {subscription.lessonsPerMonth} lessons available
              </span>
              <span className="font-medium text-foreground">{usagePercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  usagePercent > 50
                    ? "bg-blue-500"
                    : usagePercent > 20
                      ? "bg-yellow-500"
                      : "bg-red-500"
                )}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Renewal and actions */}
          <div className="mt-3 flex items-center justify-between">
            <div>
              {subscription.renewsAt && (
                <span className="text-xs text-muted-foreground">
                  Renews{" "}
                  {new Date(subscription.renewsAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>

            {!isPaused && (
              <Link
                href={`/student/book?tutor=${subscription.tutorId}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Book Now
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
