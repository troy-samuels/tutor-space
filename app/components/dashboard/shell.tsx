"use client";

import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWideLayout = ["/calendar"].some((prefix) => pathname?.startsWith(prefix));
  const contentWidth = isWideLayout ? "max-w-6xl" : "max-w-4xl";

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          <div className={cn("mx-auto w-full", contentWidth)}>
            {children}
          </div>
        </main>
      </div>
      <DashboardBottomNav />
    </div>
  );
}
