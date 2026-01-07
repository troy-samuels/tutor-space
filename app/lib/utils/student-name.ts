import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function getStudentDisplayName(
  supabase: SupabaseClient,
  user: User
): Promise<string | null> {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : null;

  const { data, error } = await supabase
    .from("students")
    .select("full_name")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load student name:", error);
  }

  const fullName = data?.full_name?.trim() || null;
  return fullName || metadataName;
}
