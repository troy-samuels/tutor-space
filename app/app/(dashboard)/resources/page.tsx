"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResourcesPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Resources</h1>
        <p className="text-sm text-muted-foreground">
          Upload lesson materials, worksheets, and media to share with students or reuse across plans.
        </p>
      </header>

      <Card className="border border-dashed border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Resource library coming soon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            You&apos;ll be able to organise PDFs, slides, and videos, then attach them to bookings and lesson notes.
          </p>
          <Button size="sm" asChild>
            <Link href="/lesson-plans">Draft a lesson plan</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
