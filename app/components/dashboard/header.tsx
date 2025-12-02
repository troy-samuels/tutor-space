"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Search, Bell, Upload, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardQuickLinks } from "@/components/dashboard/quick-links";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";

type DashboardHeaderProps = {
  mobileNavTrigger?: ReactNode;
  onOpenMobileNav?: () => void;
};

export function DashboardHeader({ mobileNavTrigger, onOpenMobileNav }: DashboardHeaderProps) {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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

  const getInitials = () => {
    if (!profile?.full_name) return "TU";
    
    const nameParts = profile.full_name.trim().split(" ").filter(Boolean);
    if (nameParts.length === 0) return "TU";
    
    if (nameParts.length === 1) {
      // Single name - take first 2 letters
      return nameParts[0].slice(0, 2).toUpperCase();
    }
    
    // Multiple names - take first letter of first and last name
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials();
  const avatarUrl = profile?.avatar_url?.trim() || undefined;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/70 px-4 backdrop-blur sm:gap-4 sm:px-6 lg:px-10">
        {mobileNavTrigger ?? defaultTrigger}

        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileSearchOpen(true)}
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Desktop Search */}
        <div className="relative hidden w-full max-w-xs items-center lg:flex xl:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search students, bookings, resources..."
            className="pl-9"
          />
        </div>

        {/* Quick Action Buttons */}
        <DashboardQuickLinks />
      
      {/* Right-side actions */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <Button variant="outline" size="icon" className="shrink-0">
          <Upload className="h-4 w-4" />
          <span className="sr-only">Create content</span>
        </Button>
        <Button variant="ghost" size="icon" className="relative shrink-0">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <Link href="/settings/profile" className="flex items-center gap-2 shrink-0">
          <Avatar className="h-9 w-9">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.full_name ?? "Tutor"} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left text-sm leading-tight xl:block">
            <p className="font-medium">{profile?.full_name ?? "Tutor"}</p>
            <p className="text-xs text-muted-foreground">{profile?.email ?? "View profile"}</p>
          </div>
        </Link>
      </div>
    </header>

      {/* Mobile Search Modal */}
      <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen} side="top">
        <SheetOverlay onClick={() => setMobileSearchOpen(false)} />
        <SheetContent side="top" className="h-auto max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Search Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-semibold">Search</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSearchOpen(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close search</span>
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search students, bookings, resources..."
                className="pl-10 h-12 text-base"
                autoFocus
              />
            </div>

            {/* Search Results/Suggestions */}
            {searchTerm.trim() ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Searching for &ldquo;{searchTerm}&rdquo;...
                </p>
                {/* Placeholder for search results */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                  No results found. Search functionality coming soon.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">Quick Links</p>
                <div className="space-y-2">
                  <Link
                    href="/students"
                    onClick={() => setMobileSearchOpen(false)}
                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-brown/10">
                      <Search className="h-5 w-5 text-brand-brown" />
                    </div>
                    <div>
                      <div className="font-medium">Students</div>
                      <div className="text-xs text-muted-foreground">View all students</div>
                    </div>
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setMobileSearchOpen(false)}
                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-brown/10">
                      <Search className="h-5 w-5 text-brand-brown" />
                    </div>
                    <div>
                      <div className="font-medium">Bookings</div>
                      <div className="text-xs text-muted-foreground">View all bookings</div>
                    </div>
                  </Link>
                  <Link
                    href="/services"
                    onClick={() => setMobileSearchOpen(false)}
                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-brown/10">
                      <Search className="h-5 w-5 text-brand-brown" />
                    </div>
                    <div>
                      <div className="font-medium">Services</div>
                      <div className="text-xs text-muted-foreground">Manage your services</div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
