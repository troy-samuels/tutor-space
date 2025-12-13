import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function PagesLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="hidden gap-6 p-6 md:grid md:grid-cols-[2fr_3fr]">
        {/* Control deck skeleton */}
        <Card className="h-[calc(100vh-96px)] border-neutral-200 bg-white/80 p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-6 w-32" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </Card>
        {/* Preview skeleton */}
        <div className="h-[calc(100vh-96px)] rounded-3xl bg-stone-100/80 p-6">
          <div className="mx-auto flex h-full max-w-[420px] items-center justify-center">
            <Skeleton className="h-full w-full max-w-[380px] rounded-[32px]" />
          </div>
        </div>
      </div>
      {/* Mobile skeleton */}
      <div className="p-4 md:hidden">
        <Skeleton className="h-[70vh] w-full rounded-[28px]" />
      </div>
    </div>
  );
}
