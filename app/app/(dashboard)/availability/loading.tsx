import { Skeleton } from "@/components/ui/skeleton";

export default function AvailabilityLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>

      {/* Week grid skeleton */}
      <div className="rounded-xl border bg-card">
        <div className="grid grid-cols-7 gap-px bg-muted/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="bg-card p-4 text-center">
              <Skeleton className="mx-auto h-5 w-12" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-muted/50">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="min-h-32 bg-card p-3 space-y-2">
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
