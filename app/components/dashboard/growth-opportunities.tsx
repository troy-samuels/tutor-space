"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Rocket, LineChart, Users, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { track, trackOnce } from "@/lib/analytics";

type GrowthPlan = "professional" | "growth" | "studio";

type GrowthOpportunitiesProps = {
  plan: GrowthPlan;
};

const professionalItems = [
  {
    title: "Unlock Growth tools",
    description:
      "Access lead funnels, Link in Bio analytics, and AI marketing prompts to stay fully booked.",
    href: "/upgrade?plan=growth",
    icon: Rocket,
    cta: "Upgrade to Growth",
  },
  {
    title: "Activate Studio suite",
    description:
      "Sell curriculum, run group sessions, and track executive metrics to scale beyond solo tutoring.",
    href: "/upgrade?plan=studio",
    icon: Layers,
    cta: "Explore Studio",
  },
];

const growthItems = [
  {
    title: "Activate Studio suite",
    description:
      "Upgrade to unlock group sessions, marketplace listings, and the executive dashboard.",
    href: "/upgrade?plan=studio",
    icon: Layers,
    cta: "Upgrade to Studio",
  },
  {
    title: "Optimize your funnels",
    description: "Review analytics to double down on the channels bringing in your best students.",
    href: "/analytics",
    icon: LineChart,
    cta: "Open analytics",
  },
];

const studioItems = [
  {
    title: "Invite your teaching team",
    description:
      "Add co-tutors and assistants so they can manage sessions, resources, and student updates.",
    href: "/settings/team",
    icon: Users,
    cta: "Manage team",
  },
  {
    title: "Launch marketplace offerings",
    description: "Publish lesson plans, curriculum kits, or resource bundles in your storefront.",
    href: "/studio/marketplace",
    icon: Layers,
    cta: "Open marketplace",
  },
];

export function GrowthOpportunities({ plan }: GrowthOpportunitiesProps) {
  const items = plan === "studio" ? studioItems : plan === "growth" ? growthItems : professionalItems;

  useEffect(() => {
    trackOnce("upgrade_prompt_view", { plan });
  }, [plan]);

  return (
    <Card className="border border-dashed border-primary/40 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Grow your business</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
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
