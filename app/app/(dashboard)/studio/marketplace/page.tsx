"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudioMarketplacePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Marketplace</h1>
        <p className="text-sm text-muted-foreground">
          Package and sell curriculum, lesson bundles, and recordings to your community.
        </p>
      </header>

      <Card className="border border-dashed border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Marketplace launching soon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Studio subscribers will be able to list products, deliver downloads, and track sales performance here.
          </p>
          <Button size="sm" asChild>
            <Link href="/upgrade?plan=studio">See plans</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
