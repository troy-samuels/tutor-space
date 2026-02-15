import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { RecapSummary, RecapExercise } from "@/lib/recap/types";
import RecapExperience from "./RecapExperience";

type PageProps = {
  params: Promise<{ shortId: string }>;
};

export default async function RecapPage({ params }: PageProps) {
  const { shortId } = await params;

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    notFound();
  }

  const { data: recap, error } = await adminClient
    .from("recaps")
    .select("id, short_id, summary, exercises, created_at, tutor_id, tutor_display_name")
    .eq("short_id", shortId)
    .single();

  if (error || !recap) {
    notFound();
  }

  // Resolve tutor username for profile linking (the growth flywheel)
  let tutorUsername: string | null = null;
  if (recap.tutor_id) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("username")
      .eq("id", recap.tutor_id)
      .single();
    tutorUsername = profile?.username ?? null;
  }

  return (
    <RecapExperience
      recapId={recap.id}
      shortId={recap.short_id}
      summary={recap.summary as unknown as RecapSummary}
      exercises={recap.exercises as unknown as RecapExercise[]}
      createdAt={recap.created_at}
      tutorDisplayName={recap.tutor_display_name}
      tutorUsername={tutorUsername}
    />
  );
}
