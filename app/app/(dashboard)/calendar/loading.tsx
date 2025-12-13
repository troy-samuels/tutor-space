import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="space-y-6">
      {/* Header with view switcher */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Calendar grid skeleton */}
      <div className="rounded-xl border bg-card">
        {/* Calendar header */}
        <div className="flex items-center justify-between border-b p-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-px border-b bg-muted/50">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-card p-2 text-center">
              <Skeleton className="mx-auto h-4 w-8" />
            </div>
          ))}
        </div>

        {/* Calendar days skeleton */}
        <div className="grid grid-cols-7 gap-px bg-muted/50">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-24 bg-card p-2">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="mt-2 h-2 w-10" />
              <Skeleton className="mt-1 h-2 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
