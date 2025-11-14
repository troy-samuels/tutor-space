"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardQuickLinks() {
  return (
    <div className="hidden items-center gap-2 lg:flex shrink-0">
      <Button variant="outline" size="sm" asChild className="whitespace-nowrap shrink-0">
        <Link href="/bookings/new">Schedule session</Link>
      </Button>
      <Button size="sm" asChild className="whitespace-nowrap shrink-0 bg-brand-brown hover:bg-brand-brown/90 text-white">
        <Link href="/lesson-plans/new">Create lesson plan</Link>
      </Button>
    </div>
  );
}

