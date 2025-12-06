"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardQuickLinks } from "@/components/dashboard/quick-links";
import { Logo } from "@/components/Logo";

export function DashboardHeader() {
  const { profile } = useAuth();

  const getInitials = () => {
    if (!profile?.full_name) return "TU";
    const nameParts = profile.full_name.trim().split(" ").filter(Boolean);
    if (nameParts.length === 0) return "TU";
    if (nameParts.length === 1) {
      return nameParts[0].slice(0, 2).toUpperCase();
    }
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials();
  const avatarUrl = profile?.avatar_url?.trim() || undefined;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 bg-background/95 px-4 shadow-sm backdrop-blur sm:gap-4 sm:px-6 lg:px-10">
      {/* Logo */}
      <Logo href="/dashboard" variant="wordmark" />

      {/* Quick Action Buttons */}
      <DashboardQuickLinks />

      {/* Right-side actions */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <Button variant="ghost" size="icon" className="relative shrink-0">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Link href="/settings/profile" className="shrink-0">
          <Avatar className="h-8 w-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.full_name ?? "Tutor"} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
