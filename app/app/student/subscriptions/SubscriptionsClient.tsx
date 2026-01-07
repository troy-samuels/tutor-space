"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { RefreshCw, AlertCircle, Calendar, CreditCard, BookOpen } from "lucide-react";
import type { StudentSubscriptionView } from "@/lib/actions/subscriptions";
import { cancelSubscription } from "@/lib/actions/subscriptions";
import { formatCurrency } from "@/lib/utils";

interface SubscriptionsClientProps {
  subscriptions: StudentSubscriptionView[];
  error?: string;
}

export function SubscriptionsClient({ subscriptions, error }: SubscriptionsClientProps) {
  const [localSubscriptions, setLocalSubscriptions] = useState(subscriptions);
  const [isPending, startTransition] = useTransition();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  const handleCancel = async (subscriptionId: string, tutorName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your subscription with ${tutorName}? You'll retain access until the end of your current billing period.`
    );
    if (!confirmed) return;

    setCancelError(null);
    setCancelSuccess(null);

    startTransition(async () => {
      const result = await cancelSubscription(subscriptionId);
      if (result.error) {
        setCancelError(result.error);
      } else {
        setCancelSuccess(`Subscription with ${tutorName} will be cancelled at the end of your billing period.`);
        // Update local state to show cancellation pending
        setLocalSubscriptions((prev) =>
          prev.map((sub) =>
            sub.id === subscriptionId ? { ...sub, cancelAtPeriodEnd: true } : sub
          )
        );
      }
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mr-2 inline-block h-4 w-4" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Lesson Subscriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your monthly lesson subscriptions with tutors
        </p>
      </div>

      {cancelError && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mr-2 inline-block h-4 w-4" />
          {cancelError}
        </div>
      )}

      {cancelSuccess && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          {cancelSuccess}
        </div>
      )}

      {localSubscriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <RefreshCw className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-medium text-foreground">No active subscriptions</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            When you subscribe to a tutor&apos;s lesson plan, it will appear here.
          </p>
          <Link
            href="/student/search"
            className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Find tutors
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {localSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onCancel={() => handleCancel(subscription.id, subscription.tutor.fullName)}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubscriptionCard({
  subscription,
  onCancel,
  isPending,
}: {
  subscription: StudentSubscriptionView;
  onCancel: () => void;
  isPending: boolean;
}) {
  const usagePercent = Math.round(
    ((subscription.balance.lessonsUsed) /
      (subscription.balance.lessonsAllocated + subscription.balance.lessonsRolledOver)) *
      100
  ) || 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      {/* Tutor Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {subscription.tutor.avatarUrl ? (
            <Image
              src={subscription.tutor.avatarUrl}
              alt={subscription.tutor.fullName}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {subscription.tutor.fullName.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-foreground">{subscription.tutor.fullName}</h3>
            <p className="text-sm text-muted-foreground">
              {subscription.template.serviceName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {subscription.cancelAtPeriodEnd ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              Cancelling
            </span>
          ) : subscription.status === "past_due" ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              Past due
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Subscription Details */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Plan:</span>
          <span className="font-medium text-foreground">
            {subscription.template.lessonsPerMonth} lessons/month
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Price:</span>
          <span className="font-medium text-foreground">
            {formatCurrency(subscription.template.priceCents, subscription.template.currency)}/month
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {subscription.cancelAtPeriodEnd ? "Ends:" : "Renews:"}
          </span>
          <span className="font-medium text-foreground">
            {format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")}
          </span>
        </div>
      </div>

      {/* Lesson Credits */}
      <div className="mt-4 rounded-xl bg-muted/30 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Lesson credits this period</span>
          <span className="text-sm font-semibold text-primary">
            {subscription.balance.lessonsAvailable} available
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {subscription.balance.lessonsUsed} used
            {subscription.balance.lessonsRolledOver > 0 && (
              <span className="ml-1">
                ({subscription.balance.lessonsRolledOver} rolled over)
              </span>
            )}
          </span>
          <span>
            {subscription.balance.lessonsAllocated + subscription.balance.lessonsRolledOver} total
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <Link
          href={`/${subscription.tutor.username}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Book a lesson
        </Link>

        {!subscription.cancelAtPeriodEnd && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="text-sm font-medium text-destructive hover:underline disabled:opacity-50"
          >
            {isPending ? "Cancelling..." : "Cancel subscription"}
          </button>
        )}
      </div>
    </div>
  );
}
