import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getPlanTier, hasProAccess, hasStudioAccess } from "@/lib/payments/subscriptions";
import { createClient } from "@/lib/supabase/server";
import type { PlatformBillingPlan } from "@/lib/types/payments";

export const metadata: Metadata = {
  title: "TutorLingua | Dashboard",
  description: "Run your tutoring business, manage bookings, and track growth in one place.",
};

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server-side redirect for unauthenticated users
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, subscription_status, avatar_url, plan, username, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.role && profile.role !== "tutor") {
    redirect("/student/login");
  }

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const plan: PlatformBillingPlan =
    (profile?.plan as PlatformBillingPlan | null) ?? "professional";
  const entitlements = {
    plan,
    tier: getPlanTier(plan),
    isPaid: hasProAccess(plan),
    hasProAccess: hasProAccess(plan),
    hasStudioAccess: hasStudioAccess(plan),
  } as const;

  return (
    <AuthProvider
      initialUser={user}
      initialProfile={profile ?? null}
      initialEntitlements={entitlements}
    >
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
