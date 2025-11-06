"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

type ProtectedRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
  loadingFallback?: React.ReactNode;
};

export function ProtectedRoute({
  children,
  redirectTo = "/login",
  loadingFallback = null,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [loading, user, router, redirectTo]);

  if (loading) {
    return loadingFallback;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

type RoleGuardProps = {
  allow: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function RoleGuard({ allow, fallback = null, children }: RoleGuardProps) {
  const { profile } = useAuth();

  if (!profile) return fallback;
  if (!allow.includes(profile.role)) return fallback;

  return <>{children}</>;
}

type PlanGateProps = {
  require: "growth" | "studio";
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function PlanGate({ require, fallback = null, children }: PlanGateProps) {
  const { entitlements } = useAuth();

  if (require === "studio" && !entitlements.studio) return fallback;
  if (require === "growth" && !entitlements.growth) return fallback;

  return <>{children}</>;
}

