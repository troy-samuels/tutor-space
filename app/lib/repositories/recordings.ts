import type { SupabaseClient } from "@supabase/supabase-js";

export type RecordingStatus = "transcribing" | "completed" | "failed";

type UpdateRecordingStatusInput = {
  egressId: string;
  status: RecordingStatus;
  transcriptJson?: unknown;
};

export async function updateRecordingStatus(
  client: SupabaseClient,
  { egressId, status, transcriptJson }: UpdateRecordingStatusInput
): Promise<{ error?: string }> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (transcriptJson !== undefined) {
    updateData.transcript_json = transcriptJson;
  }

  const { error } = await client
    .from("lesson_recordings")
    .update(updateData)
    .eq("egress_id", egressId);

  if (error) {
    return { error: error.message };
  }

  return {};
}
