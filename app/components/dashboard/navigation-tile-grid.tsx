"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NAV_SECTIONS, type PlanName } from "@/components/dashboard/nav-config";
import type { LucideIcon } from "lucide-react";

type NavigationTile = {
  href: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  section: string;
};

const NAV_DESCRIPTIONS: Record<string, string> = {
  "/dashboard": "View KPIs, metrics, and sprint progress at a glance.",
  "/bookings": "Manage upcoming lessons, payments, and reminders.",
  "/students": "Open your CRM to review notes and progress.",
  "/services": "Publish or edit the lessons and packages you sell.",
  "/messages": "Respond to student requests and lead inquiries.",
  "/digital-products": "Sell printable resources and async lessons.",
  "/availability": "Update your booking windows and time buffers.",
  "/marketing/links": "Refresh your link hub and social CTAs.",
  "/marketing/email": "Send nurture sequences and broadcasts.",
  "/analytics": "Watch revenue, conversion, and channel trends.",
  "/ai": "Generate copy, lesson notes, and parent updates with AI.",
};

type NavigationTileGridProps = {
  plan: "professional" | "growth" | "studio";
};

export function NavigationTileGrid({ plan }: NavigationTileGridProps) {
  const canAccessSection = (required?: PlanName) => {
    if (!required) return true;
    if (required === "growth") {
      return plan === "growth" || plan === "studio";
    }
    return plan === "studio";
  };

  const tiles: NavigationTile[] = [];

  NAV_SECTIONS.forEach((section) => {
    if (!canAccessSection(section.plan)) {
      return;
    }

    section.items.forEach((item) => {
      // Filter out disabled items (marked as "Soon")
      if (item.disabled) return;

      const cleanedLabel = item.label.replace(/\s+\(Soon\)$/i, "");
      const description = NAV_DESCRIPTIONS[item.href] ?? `Navigate to ${cleanedLabel}`;

      tiles.push({
        href: item.href,
        label: cleanedLabel,
        description,
        Icon: item.icon,
        section: section.label,
      });
    });
  });

  // Remove duplicates based on href
  const uniqueTiles = Array.from(
    new Map(tiles.map((tile) => [tile.href, tile])).values()
  );

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {uniqueTiles.map((tile) => (
        <Link
          key={tile.href}
          href={tile.href}
          className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
        >
          <Card className="h-full rounded-3xl border border-border/60 bg-background/95 shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {tile.section}
                </p>
                <CardTitle className="mt-1 text-lg font-semibold text-foreground">
                  {tile.label}
                </CardTitle>
              </div>
              <tile.Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{tile.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </section>
  );
}
