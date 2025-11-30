import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function resolveEntitlements() {
  return { growth: true, studio: true };
}

export default async function AiToolsPage() {
  const aiEnabled = process.env.NEXT_PUBLIC_AI_TOOLS_ENABLED === "true";
  if (!aiEnabled) {
    notFound();
  }

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

  const planName = subscriptions?.[0]?.plan_name ?? profile?.plan ?? "founder_lifetime";
  const entitlements = resolveEntitlements();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">AI automation hub</h1>
        <p className="text-sm text-muted-foreground">
          Draft lesson plans, homework, and parent updates with TutorLingua&apos;s AI copilots.
        </p>
      </header>

      <section className="rounded-3xl border border-border bg-white/80 p-6 shadow-sm backdrop-blur">
        <h2 className="text-base font-semibold text-foreground">Coming soon</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Campaign templates, voice practice partners, and SEO calendars will appear here as we finish
          the Growth Plan milestones.
        </p>
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          TODO: wire up AI assistants backed by Supabase functions and OpenAI endpoints per 14-24 feature guides.
        </p>
      </section>
    </div>
  );
}
