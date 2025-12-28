import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingTimeline } from "@/components/onboarding/OnboardingTimeline";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, email, onboarding_completed, stripe_charges_enabled")
    .eq("id", user.id)
    .single();

  // If onboarding is already completed, redirect to dashboard
  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      <Suspense fallback={<OnboardingLoadingSkeleton />}>
        <OnboardingTimeline
          profile={{
            id: user.id,
            full_name: profile?.full_name ?? null,
            username: profile?.username ?? null,
            email: profile?.email ?? user.email ?? null,
            stripe_charges_enabled: profile?.stripe_charges_enabled ?? false,
          }}
        />
      </Suspense>
    </div>
  );
}

function OnboardingLoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl animate-pulse">
      <div className="mb-6 sm:mb-8 text-center">
        <div className="h-7 w-48 bg-muted rounded mx-auto" />
        <div className="h-4 w-64 bg-muted rounded mx-auto mt-2" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
