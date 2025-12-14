"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { LockedFeatureCard } from "./LockedFeatureCard";
import {
  STUDIO_FEATURE_MAP,
  type StudioFeatureId,
} from "./StudioFeatureInfo";

type StudioFeatureGateProps = {
  feature: StudioFeatureId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function StudioFeatureGate({
  feature,
  children,
  fallback,
}: StudioFeatureGateProps) {
  const { entitlements } = useAuth();

  if (entitlements?.hasStudioAccess) {
    return <>{children}</>;
  }

  const info = STUDIO_FEATURE_MAP[feature];

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <LockedFeatureCard
      title={info.title}
      description={info.description}
      icon={info.icon}
    />
  );
}
