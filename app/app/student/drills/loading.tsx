import { Skeleton } from "@/components/ui/skeleton";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";

export default function DrillsLoading() {
  return (
    <StudentPortalLayout>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>

        {/* Progress card skeleton */}
        <Skeleton className="h-36 w-full rounded-xl" />

        {/* Section header skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="ml-auto h-5 w-8 rounded-full" />
        </div>

        {/* Drill cards skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border bg-white p-4"
            >
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full max-w-xs" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-5" />
            </div>
          ))}
        </div>
      </div>
    </StudentPortalLayout>
  );
}
