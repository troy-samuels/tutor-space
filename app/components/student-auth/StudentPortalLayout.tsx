"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, MessageSquare, User, Settings } from "lucide-react";
import { StudentBottomNav } from "./StudentBottomNav";
import { studentLogout } from "@/lib/actions/student-auth";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";

interface StudentPortalLayoutProps {
  children: React.ReactNode;
  studentName?: string | null;
}

export function StudentPortalLayout({
  children,
  studentName,
}: StudentPortalLayoutProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const unreadMessages = useUnreadMessages("student");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await studentLogout();
      router.push("/student-auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* Minimal header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/student-auth/search" className="flex items-center gap-2">
            <span className="text-lg font-semibold text-primary">
              TutorLingua
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {studentName && (
              <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {studentName}
              </span>
            )}
            <Link
              href="/student-auth/messages"
              className="relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
              {unreadMessages > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Link>
            <Link
              href="/student-auth/settings"
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isLoggingOut ? "Logging out..." : "Log out"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6">{children}</main>

      {/* Bottom navigation */}
      <StudentBottomNav unreadCount={unreadMessages} />
    </div>
  );
}
