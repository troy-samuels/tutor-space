"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

type EmptyState = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

type EmptyStatesProps = {
  profileComplete: boolean;
  hasServices: boolean;
  hasAvailability: boolean;
  hasStudents: boolean;
};

export function EmptyStates({
  profileComplete,
  hasServices,
  hasAvailability,
  hasStudents,
}: EmptyStatesProps) {
  const states: EmptyState[] = [];

  if (!profileComplete) {
    states.push({
      title: "Complete your profile",
      description: "Add a photo, bio, and teaching focus so families know what makes you unique.",
      href: "/settings/profile",
      ctaLabel: "Update profile",
    });
  }

  if (!hasServices) {
    states.push({
      title: "Publish your first service",
      description: "Create a flagship lesson or package so students can book with confidence.",
      href: "/services/new",
      ctaLabel: "Create service",
    });
  }

  if (!hasAvailability) {
    states.push({
      title: "Share your availability",
      description: "Set recurring hours or ad-hoc slots to open up your booking calendar.",
      href: "/availability",
      ctaLabel: "Add availability",
    });
  }

  if (!hasStudents) {
    states.push({
      title: "Import or invite students",
      description: "Invite existing learners or import a CSV to start tracking progress.",
      href: "/students/import",
      ctaLabel: "Add students",
    });
  }

  if (states.length === 0) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base font-semibold">You&apos;re all set 🎉</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Your dashboard is configured. Keep an eye on bookings and follow-ups here.</p>
          <Button asChild size="sm" variant="secondary">
            <Link
              href="/analytics"
              onClick={() => track("empty_state_cta_click", { cta: "view_analytics" })}
            >
              View analytics
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {states.map((state) => (
        <Card
          key={state.title}
          className="border border-dashed border-border bg-muted/10 shadow-sm backdrop-blur"
        >
          <CardHeader>
            <CardTitle className="text-base font-semibold">{state.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{state.description}</p>
            <Button asChild size="sm">
              <Link
                href={state.href}
                onClick={() =>
                  track("empty_state_cta_click", {
                    cta: state.ctaLabel,
                    destination: state.href,
                  })
                }
              >
                {state.ctaLabel}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

EmptyStates.Skeleton = function EmptyStatesSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-xl bg-muted/30" />
      ))}
    </div>
  );
};
