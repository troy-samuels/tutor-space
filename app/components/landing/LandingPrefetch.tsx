"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const PREFETCH_ROUTES = [
  "/signup",
  "/login",
  "/pricing",
  "/blog",
  "/help",
  "/privacy",
  "/terms",
  "/about",
  "/contact",
  "/community",
  "/security",
  "/admin/login",
] as const;

export function LandingPrefetch() {
  const router = useRouter();

  useEffect(() => {
    PREFETCH_ROUTES.forEach((route) => {
      router.prefetch(route);
    });
  }, [router]);

  return null;
}
