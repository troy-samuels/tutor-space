"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { CalendarSidebar } from "@/components/dashboard/calendar-sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetOverlay className="lg:hidden" onClick={() => setMobileNavOpen(false)} />
        <div className="flex min-h-screen">
          {/* Left Sidebar */}
          <aside className="hidden w-72 flex-shrink-0 border-r border-border bg-background/80 backdrop-blur lg:flex">
            <DashboardSidebar />
          </aside>

          <SheetContent side="left" className="w-72 border-r border-border bg-background p-0 lg:hidden">
            <DashboardSidebar onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>

          {/* Main Content Area */}
          <div className="flex min-h-screen flex-1 flex-col">
            <DashboardHeader
              onOpenMobileNav={() => setMobileNavOpen(true)}
              mobileNavTrigger={
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation</span>
                </Button>
              }
            />
            <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-10">
              {children}
            </main>
          </div>

          {/* Right Sidebar - Calendar */}
          <aside className="hidden xl:flex w-80 flex-shrink-0 border-l border-border bg-background/80 backdrop-blur">
            <CalendarSidebar />
          </aside>
        </div>
      </Sheet>
      <DashboardBottomNav />
    </div>
  );
}
