"use client";

import Link from "next/link";
import { useTransition, useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardQuickLinks } from "@/components/dashboard/quick-links";
import { Logo } from "@/components/Logo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";
import {
  User,
  CreditCard,
  Globe,
  Copy,
  Check,
  HelpCircle,
  LogOut,
  ExternalLink,
  Video,
} from "lucide-react";

export function DashboardHeader() {
  const { user, profile, entitlements, loading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataFullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const metadataFirstName = typeof metadata.first_name === "string" ? metadata.first_name.trim() : "";
  const metadataLastName = typeof metadata.last_name === "string" ? metadata.last_name.trim() : "";
  const metadataUsername = typeof metadata.username === "string" ? metadata.username.trim() : "";
  const metadataAvatarUrl =
    typeof metadata.avatar_url === "string"
      ? metadata.avatar_url.trim()
      : typeof metadata.avatar === "string"
        ? metadata.avatar.trim()
        : "";

  const handleSignOut = () => {
    startTransition(async () => {
      const channel = new BroadcastChannel("auth");
      channel.postMessage("auth:update");
      channel.close();
      await signOut();
    });
  };

  const handleCopyBookingLink = async () => {
    const link = `${window.location.origin}/${profile?.username}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTierBadge = () => {
    if (entitlements?.hasStudioAccess)
      return { label: "Studio", color: "bg-primary/10 text-primary" };
    if (entitlements?.hasProAccess)
      return { label: "Pro", color: "bg-emerald-100 text-emerald-700" };
    return { label: "Free", color: "bg-gray-100 text-gray-600" };
  };

  const tierBadge = getTierBadge();

  const displayName = useMemo(() => {
    const profileName = profile?.full_name?.trim();
    const onboardingName = (metadataFullName || `${metadataFirstName} ${metadataLastName}`.trim()).trim();
    const handle = profile?.username || metadataUsername;
    return profileName || onboardingName || handle || null;
  }, [
    metadataFirstName,
    metadataFullName,
    metadataLastName,
    metadataUsername,
    profile?.full_name,
    profile?.username,
  ]);

  const emailForDisplay = profile?.email || user?.email || null;

  const initials = useMemo(() => {
    const sourceName = displayName?.trim();
    if (sourceName) {
      const nameParts = sourceName.split(" ").filter(Boolean);
      if (nameParts.length >= 2) {
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
      }
      if (nameParts.length === 1 && nameParts[0].length > 0) {
        return nameParts[0].slice(0, 2).toUpperCase();
      }
    }

    if (emailForDisplay) {
      return emailForDisplay.slice(0, 2).toUpperCase();
    }

    return "TL";
  }, [displayName, emailForDisplay]);

  const avatarUrl = useMemo(() => {
    const profileUrl = profile?.avatar_url?.trim();
    if (profileUrl) return profileUrl;
    if (metadataAvatarUrl) return metadataAvatarUrl;
    return undefined;
  }, [metadataAvatarUrl, profile?.avatar_url]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 bg-background/95 px-4 shadow-sm backdrop-blur sm:gap-4 sm:px-6 lg:px-10">
      {/* Logo */}
      <Logo href="/dashboard" variant="wordmark" />

      {/* Quick Action Buttons (desktop only) */}
      <div className="hidden flex-1 justify-center lg:flex">
        <DashboardQuickLinks />
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        <NotificationBell userRole="tutor" />
        <DropdownMenu>
          <DropdownMenuTrigger className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            {loading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : (
              <Avatar className="h-9 w-9">
                {avatarUrl && (
                  <AvatarImage
                    src={avatarUrl}
                    alt={displayName ?? "Tutor"}
                  />
                )}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* User Identity Section */}
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  {avatarUrl && (
                    <AvatarImage
                      src={avatarUrl}
                      alt={displayName ?? "Tutor"}
                    />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">
                    {displayName || "Tutor"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                    {emailForDisplay || " "}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full w-fit ${tierBadge.color}`}
                  >
                    {tierBadge.label}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Navigation Section */}
            <DropdownMenuItem asChild>
              <Link href="/settings/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/billing" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Account & Billing
              </Link>
            </DropdownMenuItem>
            {profile?.username && (
              <DropdownMenuItem asChild>
                <a
                  href={`/${profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  View My Site
                  <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                </a>
              </DropdownMenuItem>
            )}
            {entitlements?.hasStudioAccess && (
              <DropdownMenuItem asChild>
                <Link href="/classroom/test" className="cursor-pointer">
                  <Video className="mr-2 h-4 w-4" />
                  Test Studio
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Actions Section */}
            {profile?.username && (
              <DropdownMenuItem
                onClick={handleCopyBookingLink}
                className="cursor-pointer"
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy Booking Link"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <a
                href="https://tutorlingua.co/support"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
                <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Sign Out Section */}
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isPending}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isPending ? "Signing out..." : "Sign Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
