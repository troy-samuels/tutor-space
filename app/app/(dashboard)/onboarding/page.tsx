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
    .select("id, full_name, username, email, onboarding_completed")
    .eq("id", user.id)
    .single();

  // If onboarding is already completed, redirect to dashboard
  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      <OnboardingTimeline
        profile={{
          id: user.id,
          full_name: profile?.full_name ?? null,
          username: profile?.username ?? null,
          email: profile?.email ?? user.email ?? null,
        }}
      />
    </div>
  );
}
