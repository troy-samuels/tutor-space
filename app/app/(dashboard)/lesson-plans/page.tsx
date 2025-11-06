"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LessonPlansPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Lesson Plans</h1>
        <p className="text-sm text-muted-foreground">
          Build reusable lesson outlines, align objectives with resources, and share recap notes with families.
        </p>
      </header>

      <Card className="border border-dashed border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Plan builder in progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Soon you&apos;ll turn templates into structured sessions with objectives, timings, and resource links.
          </p>
          <Button size="sm" asChild>
            <Link href="/resources">Browse resources</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
