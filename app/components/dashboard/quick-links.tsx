"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardQuickLinks() {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Button variant="secondary" size="sm" asChild>
        <Link href="/bookings/new">Schedule session</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/lesson-plans/new">Create lesson plan</Link>
      </Button>
    </div>
  );
}

