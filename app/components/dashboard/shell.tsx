"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isWideLayout = ["/calendar", "/analytics"].some((prefix) =>
    pathname?.startsWith(prefix)
  );
  const contentWidth = isWideLayout ? "max-w-6xl" : "max-w-4xl";

  // Prefetch most-visited dashboard pages for faster navigation
  useEffect(() => {
    const connection = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    const saveData = Boolean(connection?.saveData);
    const effectiveType = connection?.effectiveType;
    const isSlow =
      effectiveType === "slow-2g" || effectiveType === "2g";

    if (saveData || isSlow) return;

    const prefetchTargets = [
      "/dashboard",
      "/calendar",
      "/students",
      "/bookings",
      "/messages",
      "/services",
    ];

    const schedule = (callback: () => void) => {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
        .requestIdleCallback;
      if (ric) return ric(callback, { timeout: 2500 });
      return window.setTimeout(callback, 1500);
    };

    const cancel = (id: number) => {
      const cancelRic = (window as unknown as { cancelIdleCallback?: (id: number) => void })
        .cancelIdleCallback;
      if (cancelRic) cancelRic(id);
      else window.clearTimeout(id);
    };

    const id = schedule(() => {
      prefetchTargets.forEach((path) => router.prefetch(path));
    });

    return () => cancel(id);
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:pb-10">
          <div className={cn("mx-auto w-full", contentWidth)}>
            {children}
          </div>
        </main>
      </div>
      <DashboardBottomNav />
    </div>
  );
}
