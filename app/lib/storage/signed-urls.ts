import type { SupabaseClient } from "@supabase/supabase-js";

export async function getSignedUrl(
  client: SupabaseClient,
  bucket: string,
  objectPath: string,
  expiresInSeconds: number
): Promise<string | null> {
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresInSeconds);

  if (error) return null;
  return data?.signedUrl ?? null;
}
