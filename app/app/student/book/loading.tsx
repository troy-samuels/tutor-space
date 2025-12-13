import { Skeleton } from "@/components/ui/skeleton";

export default function BookingLoading() {
  return (
    <div className="space-y-6 pb-24">
      {/* Page header skeleton */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* Tutor selector skeleton */}
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Credits banner skeleton */}
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      {/* Services section skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-border bg-white p-4"
            >
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full max-w-xs" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 ml-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Time slots skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Date selector skeleton */}
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-20 rounded-xl shrink-0" />
          ))}
        </div>

        {/* Time grid skeleton */}
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <Skeleton key={i} className="h-11 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
