import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScenarioBuilder } from "@/components/practice/ScenarioBuilder";

export const metadata = {
  title: "Practice Scenarios | TutorLingua",
  description: "Create AI conversation practice templates for your students",
};

export default async function PracticeScenariosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch tutor's existing scenarios
  const { data: scenarios } = await supabase
    .from("practice_scenarios")
    .select("*")
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Practice Scenarios
        </h1>
        <p className="text-sm text-muted-foreground">
          Create conversation templates for AI practice assignments
        </p>
      </div>

      <ScenarioBuilder scenarios={scenarios || []} />
    </div>
  );
}
