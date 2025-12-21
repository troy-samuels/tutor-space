import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { AuthProvider } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/server";
import { getPlanTier, hasProAccess, hasStudioAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import { LogoutButton } from "./logout-button";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, subscription_status, avatar_url, plan, username")
    .eq("id", user.id)
    .single();

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
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        {/* Minimal header with just logout */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Logo variant="wordmark" />
            </div>
            <LogoutButton />
          </div>
        </header>

        {/* Main content - no sidebar, no bottom nav */}
        <main className="scroll-smooth">{children}</main>
      </div>
    </AuthProvider>
  );
}
