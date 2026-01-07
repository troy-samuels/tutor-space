"use client";

import Link from "next/link";
import { Package, CreditCard, Search, Ticket, Calendar, UserPlus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackageCard } from "./PackageCard";
import { SubscriptionCard } from "./SubscriptionCard";
import type { StudentPackageCredit, StudentSubscriptionCredit, TutorOffering } from "@/lib/actions/types";

type StudentPurchasesClientProps = {
  packages: StudentPackageCredit[];
  subscriptions: StudentSubscriptionCredit[];
  connectedTutors: TutorOffering[];
  error?: string;
};

export function StudentPurchasesClient({
  packages,
  subscriptions,
  connectedTutors,
  error,
}: StudentPurchasesClientProps) {
  const hasPackages = packages.length > 0;
  const hasSubscriptions = subscriptions.length > 0;
  const isEmpty = !hasPackages && !hasSubscriptions;
  const hasConnectedTutors = connectedTutors.length > 0;

  // Calculate totals
  const totalMinutes = packages.reduce((sum, p) => sum + p.remainingMinutes, 0);
  const totalLessons = subscriptions.reduce((sum, s) => sum + s.lessonsAvailable, 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Purchases</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your lesson packages and subscriptions
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary cards */}
      {!isEmpty && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Package className="h-5 w-5" />
              <span className="text-sm font-medium">Packages</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-800">
              {totalMinutes}
              <span className="text-sm font-normal text-emerald-600 ml-1">min</span>
            </p>
            <p className="text-xs text-emerald-600">
              across {packages.length} package{packages.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <CreditCard className="h-5 w-5" />
              <span className="text-sm font-medium">Subscriptions</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-800">
              {totalLessons}
              <span className="text-sm font-normal text-blue-600 ml-1">
                lesson{totalLessons !== 1 ? "s" : ""}
              </span>
            </p>
            <p className="text-xs text-blue-600">
              available this period
            </p>
          </div>
        </div>
      )}

      {/* Smart empty state based on connection status */}
      {isEmpty && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 px-6 py-12 text-center">
          {!hasConnectedTutors ? (
            // State A: No tutors connected
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <UserPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                Connect with a Tutor First
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Find a tutor and request to connect before purchasing packages.
              </p>
              <Button asChild className="mt-4">
                <Link href="/student/search">
                  <Search className="mr-2 h-4 w-4" />
                  Find Tutors
                </Link>
              </Button>
            </>
          ) : (
            // State B/C: Connected to tutor(s)
            <>
              {connectedTutors.some((t) => t.hasPackages || t.hasSubscriptions) ? (
                // State B: Tutor has packages/subscriptions
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-foreground">
                    Ready to Get Started?
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Purchase a lesson package or subscribe for regular lessons with{" "}
                    {connectedTutors.length === 1
                      ? connectedTutors[0].tutorName
                      : "your tutors"}
                    .
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {connectedTutors.map((tutor) => (
                      <Button key={tutor.tutorId} asChild variant="outline" size="sm">
                        <Link href={`/student/book?tutor=${tutor.tutorId}`}>
                          <Calendar className="mr-2 h-4 w-4" />
                          {connectedTutors.length === 1 ? "Book a Lesson" : tutor.tutorName}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                // State C: Tutor has NO packages/subscriptions (pay-as-you-go only)
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-foreground">
                    Book Lessons Directly
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    {connectedTutors.length === 1
                      ? `${connectedTutors[0].tutorName} accepts pay-as-you-go bookings.`
                      : "Your tutors accept pay-as-you-go bookings."}{" "}
                    No packages required.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {connectedTutors.map((tutor) => (
                      <Button key={tutor.tutorId} asChild size="sm">
                        <Link href={`/student/book?tutor=${tutor.tutorId}`}>
                          <Calendar className="mr-2 h-4 w-4" />
                          {connectedTutors.length === 1 ? "Book a Lesson" : tutor.tutorName}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Session Packages section */}
      {hasPackages && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-foreground">Session Packages</h2>
            <span className="text-xs text-muted-foreground">({packages.length})</span>
          </div>
          <div className="space-y-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.purchaseId} pkg={pkg} />
            ))}
          </div>
        </section>
      )}

      {/* Subscriptions section */}
      {hasSubscriptions && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-foreground">Subscriptions</h2>
            <span className="text-xs text-muted-foreground">({subscriptions.length})</span>
          </div>
          <div className="space-y-3">
            {subscriptions.map((subscription) => (
              <SubscriptionCard key={subscription.subscriptionId} subscription={subscription} />
            ))}
          </div>
          <Link
            href="/student/subscriptions"
            className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Manage Subscriptions →
          </Link>
        </section>
      )}
    </div>
  );
}
