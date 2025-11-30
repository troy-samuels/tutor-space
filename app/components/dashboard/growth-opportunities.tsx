"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Rocket, LineChart, Users, CreditCard, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { track, trackOnce } from "@/lib/analytics";
import type { PlatformBillingPlan } from "@/lib/types/payments";

type GrowthOpportunitiesProps = {
  plan: PlatformBillingPlan;
};

const lifetimeItems = [
  {
    title: "Share your booking link",
    description: "Drive students to your 0% fee booking page and keep every repeat lesson.",
    href: "/pages",
    icon: Rocket,
    cta: "Open page builder",
  },
  {
    title: "Connect payouts",
    description: "Finish Stripe Connect onboarding so payments land in your account automatically.",
    href: "/settings/payments",
    icon: CreditCard,
    cta: "Connect Stripe",
  },
  {
    title: "Review your pipeline",
    description: "Use analytics to double down on channels bringing in your best students.",
    href: "/analytics",
    icon: LineChart,
    cta: "Open analytics",
  },
  {
    title: "Invite collaborators",
    description: "Optionally add co-tutors or assistants to manage sessions and student updates.",
    href: "/settings/team",
    icon: Users,
    cta: "Manage team",
  },
];

const waitlistItems = [
  {
    title: "Founder lifetime sold out",
    description: "Join the waitlist to be notified if new lifetime spots open.",
    href: "/#pricing",
    icon: AlertTriangle,
    cta: "Join waitlist",
  },
  {
    title: "Publish your booking page",
    description: "Go live with your services and start directing students to book directly.",
    href: "/pages",
    icon: Rocket,
    cta: "Open page builder",
  },
];

export function GrowthOpportunities({ plan }: GrowthOpportunitiesProps) {
  const items = plan === "founder_lifetime" ? lifetimeItems : waitlistItems;

  useEffect(() => {
    trackOnce("upgrade_prompt_view", { plan });
  }, [plan]);

  return (
    <Card className="border border-dashed border-primary/40 bg-primary/5">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-base font-semibold">Grow your business</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 px-6 pb-6 pt-0">
        {items.map((item) => (
          <div key={item.title} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <item.icon className="h-4 w-4 text-primary" />
              {item.title}
            </div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
            <Button asChild size="sm" variant="link" className="px-0">
              <Link
                href={item.href}
                onClick={() =>
                  track("upgrade_prompt_click", {
                    plan,
                    destination: item.href,
                    cta: item.cta,
                  })
                }
              >
                {item.cta} →
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

GrowthOpportunities.Skeleton = function GrowthOpportunitiesSkeleton() {
  return <div className="h-64 animate-pulse rounded-xl bg-muted/30" />;
};
