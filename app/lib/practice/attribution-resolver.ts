import type { SupabaseClient } from "@supabase/supabase-js";
import type { AttributionCookie } from "@/lib/practice/attribution";

const UUID_V4_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Resolves the effective tutor profile ID from attribution data.
 *
 * This supports:
 * - direct profile IDs in `tutorId`
 * - username-only attribution where `tutorId` may be a username placeholder
 *
 * @param client - Supabase client.
 * @param attribution - Parsed attribution cookie payload.
 * @returns Resolved tutor ID and username, or `null` when lookup fails.
 */
export async function resolveAttributedTutor(
  client: SupabaseClient,
  attribution: AttributionCookie | null
): Promise<{ tutorId: string; tutorUsername: string } | null> {
  if (!attribution) {
    return null;
  }

  const normalizedUsername = attribution.tutorUsername.trim().toLowerCase();
  const normalizedTutorId = attribution.tutorId.trim();

  if (UUID_V4_LIKE.test(normalizedTutorId)) {
    const { data: profileById } = await client
      .from("profiles")
      .select("id, username")
      .eq("id", normalizedTutorId)
      .limit(1)
      .maybeSingle();

    if (profileById?.id) {
      return {
        tutorId: profileById.id,
        tutorUsername: (profileById.username || normalizedUsername).toLowerCase(),
      };
    }
  }

  if (normalizedUsername.length === 0) {
    return null;
  }

  const { data: profileByUsername } = await client
    .from("profiles")
    .select("id, username")
    .eq("username", normalizedUsername)
    .limit(1)
    .maybeSingle();

  if (!profileByUsername?.id) {
    return null;
  }

  return {
    tutorId: profileByUsername.id,
    tutorUsername: (profileByUsername.username || normalizedUsername).toLowerCase(),
  };
}
