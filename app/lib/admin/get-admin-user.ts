import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { AdminUserWithAuth } from "./types";

/**
 * Fetches the active admin profile for the currently authenticated user
 * using the standard Supabase auth session and a service-role DB lookup.
 */
export async function getAdminUser(): Promise<AdminUserWithAuth | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return null;
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return null;
  }

  const { data: adminUser, error } = await adminClient
    .from("admin_users")
    .select(
      `
        id,
        auth_user_id,
        full_name,
        role,
        is_active,
        last_login_at,
        created_at,
        updated_at,
        auth_user:auth.users (
          id,
          email
        )
      `
    )
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .returns<AdminUserWithAuth>()
    .single();

  if (error || !adminUser) {
    return null;
  }

  return adminUser as AdminUserWithAuth;
}
