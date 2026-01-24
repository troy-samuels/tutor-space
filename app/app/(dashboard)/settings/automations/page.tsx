import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasProAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import { getAllAutomationRules, getAutomationActivity } from "@/lib/actions/automations";
import { AutomationsClient } from "./automations-client";

export const metadata = {
  title: "Automations | TutorLingua",
  description: "Automate messages to students based on their activity",
};

export default async function AutomationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/settings/automations");
  }

  // Fetch tutor's plan for Pro access check
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = (profile?.plan as PlatformBillingPlan) || "professional";
  const isPro = hasProAccess(plan);

  // Fetch automation data - all rules and recent activity
  const [rules, activity] = await Promise.all([
    getAllAutomationRules(),
    getAutomationActivity(20),
  ]);

  return (
    <AutomationsClient
      rules={rules}
      activity={activity}
      isPro={isPro}
    />
  );
}
