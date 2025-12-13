"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const CampaignBanner = dynamic(
  () => import("./CampaignBanner").then((mod) => mod.CampaignBanner),
  {
    ssr: false,
    loading: () => <div className="w-full h-10 bg-amber-600 animate-pulse" />,
  }
);

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

  return <CampaignBanner />;
}

