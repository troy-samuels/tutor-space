"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton loading state for the analytics Command Center dashboard
 * Matches the Bento grid layout with 12-column grid
 */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-9 w-32 animate-pulse rounded-lg bg-muted/40" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-muted/40" />
        </div>
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted/40" />
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Row 1: Revenue + MRR + Financial Health */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <Card className="h-full rounded-3xl border border-border/60 bg-white/90 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pt-5 pb-2">
              <div className="h-3 w-16 animate-pulse rounded bg-muted/40" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted/40" />
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="h-9 w-20 animate-pulse rounded bg-muted/40" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted/40" />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <Card className="h-full rounded-3xl border border-border/60 bg-white/90 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pt-5 pb-2">
              <div className="h-3 w-20 animate-pulse rounded bg-muted/40" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted/40" />
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="h-9 w-16 animate-pulse rounded bg-muted/40" />
              <div className="mt-2 h-3 w-28 animate-pulse rounded bg-muted/40" />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <Card className="h-full rounded-3xl border border-border/60 bg-white/90 shadow-sm">
            <CardContent className="grid grid-cols-2 divide-x divide-border/60 p-0">
              <div className="p-5">
                <div className="h-3 w-28 animate-pulse rounded bg-muted/40" />
                <div className="mt-3 h-9 w-24 animate-pulse rounded bg-muted/40" />
              </div>
              <div className="p-5">
                <div className="h-3 w-16 animate-pulse rounded bg-muted/40" />
                <div className="mt-3 h-9 w-20 animate-pulse rounded bg-muted/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Utilization Chart + Plan Distribution */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <div className="h-3 w-20 animate-pulse rounded bg-muted/40" />
                <div className="mt-2 h-7 w-24 animate-pulse rounded bg-muted/40" />
              </div>
              <div className="flex gap-4">
                <div className="h-3 w-16 animate-pulse rounded bg-muted/40" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted/40" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] animate-pulse rounded-lg bg-muted/20" />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Card className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
            </CardHeader>
            <CardContent>
              <div className="h-9 w-20 animate-pulse rounded bg-muted/40" />
              <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-muted/40" />
              <div className="mt-4 flex gap-4">
                <div className="h-5 w-20 animate-pulse rounded bg-muted/40" />
                <div className="h-5 w-20 animate-pulse rounded bg-muted/40" />
                <div className="h-5 w-16 animate-pulse rounded bg-muted/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Traffic Stats + Recent Activity */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-3 w-20 animate-pulse rounded bg-muted/40" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted/40" />
            </CardHeader>
            <CardContent>
              <div className="h-9 w-16 animate-pulse rounded bg-muted/40" />
              <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted/40" />
              <div className="mt-3 h-10 w-full animate-pulse rounded bg-muted/20" />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-12 lg:col-span-8">
          <Card className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <div className="h-3 w-28 animate-pulse rounded bg-muted/40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-muted/40" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-24 animate-pulse rounded bg-muted/40" />
                      <div className="h-3 w-32 animate-pulse rounded bg-muted/30" />
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-4 w-14 animate-pulse rounded bg-muted/40" />
                      <div className="h-3 w-10 animate-pulse rounded bg-muted/30" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
