import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPageLoading() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-9 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Up next skeleton */}
        <div className="xl:col-span-7 rounded-3xl border border-border/60 bg-secondary p-6 shadow-sm">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-3 h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-40" />
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="ml-auto flex flex-col gap-3">
              <Skeleton className="h-12 w-56" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-36 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar cards skeleton */}
        <div className="space-y-4 xl:col-span-5">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
