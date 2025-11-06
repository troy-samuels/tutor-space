"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudioCeoDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">CEO Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor revenue, team capacity, and marketing performance in one executive view.
        </p>
      </header>

      <Card className="border border-dashed border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Executive insights in development</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Studio accounts will soon access advanced analytics and multi-tutor reporting from this dashboard.
          </p>
          <Button size="sm" asChild>
            <Link href="/upgrade?plan=studio">Unlock Studio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
