"use client";

import { usePathname } from "next/navigation";
import { CampaignBanner } from "./CampaignBanner";

const EXCLUDED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/calendar",
  "/availability",
  "/bookings",
  "/students",
  "/services",
  "/pages",
  "/settings",
  "/analytics",
  "/marketing",
  "/messages",
  "/notifications",
  "/studio",
  "/lesson",
  "/classroom",
  "/student",
] as const;

export function CampaignBannerSlot() {
  const pathname = usePathname() ?? "/";
  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  // Server-render the banner so space is reserved and the page doesn't jump after hydration.
  return <CampaignBanner />;
}
