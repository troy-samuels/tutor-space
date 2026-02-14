"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Package } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav } from "@/components/navigation/BottomNav";
import { studentLogout } from "@/lib/actions/student-auth";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PageTransition } from "@/components/ui/page-transition";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StudentPortalLayoutProps {
  children: React.ReactNode;
  studentName?: string | null;
  avatarUrl?: string | null;
  hideNav?: boolean;
  homeworkCount?: number;
  /** @deprecated Credits display has been removed - prop kept for backwards compatibility */
  subscriptionSummary?: {
    totalAvailable: number;
    nextRenewal: string | null;
  };
}

export function StudentPortalLayout({
  children,
  studentName,
  avatarUrl,
  hideNav = false,
  homeworkCount,
}: StudentPortalLayoutProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const unreadCount = useUnreadMessages("student");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await studentLogout();
      router.push("/student/login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const initials = useMemo(() => {
    const name = studentName?.trim();
    if (name) {
      const parts = name.split(" ").filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
      }
      if (parts.length === 1 && parts[0].length > 0) {
        return parts[0].slice(0, 2).toUpperCase();
      }
    }
    return "ST";
  }, [studentName]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - matches tutor dashboard styling */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 bg-background/95 px-4 shadow-sm backdrop-blur sm:gap-4 sm:px-6 lg:px-10">
        <Link href="/student/search" className="flex items-center gap-2">
          <Logo variant="wordmark" className="h-8 w-auto" />
        </Link>

        {/* Right-side actions */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <NotificationBell userRole="student" />
          <DropdownMenu>
            <DropdownMenuTrigger className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <Avatar className="h-9 w-9">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={studentName || "Student"} />
                )}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {/* Student Identity Section */}
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    {avatarUrl && (
                      <AvatarImage src={avatarUrl} alt={studentName || "Student"} />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">
                      {studentName || "Student"}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/student/purchases"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Package className="h-4 w-4" />
                  My Purchases
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/student/settings"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? "Logging out..." : "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main
        className={
          hideNav ? "" : "mx-auto max-w-4xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6"
        }
      >
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Bottom navigation */}
      {!hideNav && (
        <BottomNav
          role="student"
          badges={{ unreadMessages: unreadCount, homeworkCount }}
        />
      )}
    </div>
  );
}
