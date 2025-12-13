import { Skeleton } from "@/components/ui/skeleton";

export default function PurchasesLoading() {
  return (
    <div className="space-y-6 pb-24">
      {/* Page header skeleton */}
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-28 mt-1" />
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <Skeleton className="h-5 w-28 mb-2" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32 mt-1" />
        </div>
      </div>

      {/* Packages section skeleton */}
      <div>
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-40 mb-3" />
                  <Skeleton className="h-2 w-full rounded-full mb-3" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriptions section skeleton */}
      <div>
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="space-y-3">
          {[1].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-36 mb-1" />
                  <Skeleton className="h-4 w-52 mb-3" />
                  <Skeleton className="h-2 w-full rounded-full mb-3" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
