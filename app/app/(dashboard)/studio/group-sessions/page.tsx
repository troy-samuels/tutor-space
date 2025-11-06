"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudioGroupSessionsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Group Sessions</h1>
        <p className="text-sm text-muted-foreground">
          Manage multi-student sessions, waitlists, and payments with the Studio toolkit.
        </p>
      </header>

      <Card className="border border-dashed border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Studio feature coming soon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Upgrade to Studio to unlock scheduling, roster management, and automated reminders for group lessons.
          </p>
          <Button size="sm" asChild>
            <Link href="/upgrade?plan=studio">Explore Studio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
