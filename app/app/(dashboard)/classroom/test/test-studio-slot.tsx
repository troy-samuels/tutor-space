"use client";

import dynamic from "next/dynamic";

const TestStudioClient = dynamic(() => import("./test-studio-client"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-pulse rounded-full bg-muted/40" />
    </div>
  ),
});

export function TestStudioSlot() {
  return <TestStudioClient />;
}

