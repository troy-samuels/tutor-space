import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function resolveEntitlements(planName: string | null | undefined) {
  const normalized = planName?.toLowerCase() ?? "professional";
  return {
    growth: normalized === "growth" || normalized === "studio",
    studio: normalized === "studio",
  };
}

export default async function AiToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user?.id ?? "")
    .single();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("plan_name")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(1);

  const planName = subscriptions?.[0]?.plan_name ?? profile?.plan ?? "professional";
  const entitlements = resolveEntitlements(planName);

  if (!entitlements.growth) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">AI tools</h1>
          <p className="text-sm text-muted-foreground">
            Unlock AI lesson planning, social content workflows, and the TutorLingua Lead Hub with the
            Growth Plan.
          </p>
        </header>

        <section className="rounded-3xl border border-brand-brown/20 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h2 className="text-base font-semibold text-foreground">Upgrade to activate AI automations</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Real-time lesson transcripts, AI homework builders, and campaign templates go live once you
            upgrade.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/#pricing"
              className="inline-flex h-10 items-center justify-center rounded-full bg-brand-brown px-5 text-xs font-semibold text-brand-white shadow-sm transition hover:bg-brand-brown/90"
            >
              View plans
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-full border border-brand-brown/40 bg-white px-5 text-xs font-semibold text-brand-brown transition hover:bg-brand-brown/10"
            >
              Back to overview
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">AI automation hub</h1>
        <p className="text-sm text-muted-foreground">
          Draft lesson plans, homework, and parent updates with TutorLingua&apos;s AI copilots.
        </p>
      </header>

      <section className="rounded-3xl border border-brand-brown/20 bg-white/80 p-6 shadow-sm backdrop-blur">
        <h2 className="text-base font-semibold text-foreground">Coming soon</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Campaign templates, voice practice partners, and SEO calendars will appear here as we finish
          the Growth Plan milestones.
        </p>
        <p className="mt-4 rounded-2xl border border-dashed border-brand-brown/30 bg-brand-brown/5 px-4 py-3 text-xs text-muted-foreground">
          TODO: wire up AI assistants backed by Supabase functions and OpenAI endpoints per 14-24 feature guides.
        </p>
      </section>
    </div>
  );
}
