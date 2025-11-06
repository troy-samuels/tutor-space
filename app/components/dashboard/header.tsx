"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Search, Bell, Upload, Menu } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardQuickLinks } from "@/components/dashboard/quick-links";

type DashboardHeaderProps = {
  mobileNavTrigger?: ReactNode;
  onOpenMobileNav?: () => void;
};

export function DashboardHeader({ mobileNavTrigger, onOpenMobileNav }: DashboardHeaderProps) {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const defaultTrigger =
    onOpenMobileNav != null ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileNav}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open navigation</span>
      </Button>
    ) : null;

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "TU";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/70 px-4 backdrop-blur sm:px-6 lg:px-10">
      {mobileNavTrigger ?? defaultTrigger}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative hidden w-full max-w-md items-center lg:flex">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search students, bookings, resources..."
            className="pl-9"
          />
        </div>
        <DashboardQuickLinks />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon">
          <Upload className="h-4 w-4" />
          <span className="sr-only">Create content</span>
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <Link href="/settings/account" className="flex items-center gap-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? "Tutor"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left text-sm leading-tight lg:block">
            <p className="font-medium">{profile?.full_name ?? "Tutor"}</p>
            <p className="text-xs text-muted-foreground">{profile?.email ?? "View profile"}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
