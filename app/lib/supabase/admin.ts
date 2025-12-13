import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ServiceRoleClient = SupabaseClient;

let cachedAdminClient: ServiceRoleClient | null = null;

export function createServiceRoleClient(): ServiceRoleClient | null {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.warn(
      "[Supabase] Service role client requested but NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing."
    );
    return null;
  }

  cachedAdminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAdminClient;
}
