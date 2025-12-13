"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin/get-admin-user";

const PAGE_SIZE = 25;

export type AdminUserFilter = {
  search?: string;
};

export type AdminListedUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string | null;
  plan: string | null;
  onboardingCompleted: boolean | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  status: "active" | "banned";
  metadata: Record<string, unknown> | null;
};

export type AdminUserListResult = {
  users: AdminListedUser[];
  page: number;
  pageSize: number;
  total: number;
};

type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  plan: string | null;
  onboarding_completed: boolean | null;
  created_at: string | null;
  auth_user:
    | {
        email: string | null;
        last_sign_in_at: string | null;
        created_at: string | null;
        banned_until: string | null;
        user_metadata: Record<string, unknown> | null;
      }
    | null;
};

export async function getUsersForAdmin(
  page = 1,
  filter: AdminUserFilter = {}
): Promise<AdminUserListResult> {
  // Security: must verify caller is admin before doing any data access
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Admin privileges required");
  }

  const supabaseAdmin = createServiceRoleClient();
  if (!supabaseAdmin) {
    throw new Error("Supabase service role is not configured");
  }

  const offset = Math.max(0, page - 1) * PAGE_SIZE;
  const search = filter.search?.trim();

  let query = supabaseAdmin
    .from("profiles")
    .select(
      `
        id,
        email,
        full_name,
        role,
        plan,
        onboarding_completed,
        created_at,
        auth_user:auth.users (
          id,
          email,
          last_sign_in_at,
          created_at,
          banned_until,
          user_metadata
        )
      `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (search) {
    // Simple search across email and name
    query = query.or(
      `email.ilike.%${search}%,full_name.ilike.%${search}%`,
      { referencedTable: "profiles" }
    );
  }

  const { data, error, count } = await query.returns<AdminUserRow[]>();

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  const users: AdminListedUser[] =
    data?.map((row: AdminUserRow) => {
      const authUser = row.auth_user;

      return {
        id: row.id,
        email: authUser?.email ?? row.email ?? null,
        fullName: row.full_name ?? null,
        role: row.role ?? null,
        plan: row.plan ?? null,
        onboardingCompleted: row.onboarding_completed ?? null,
        createdAt: authUser?.created_at ?? row.created_at ?? null,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
        status: authUser?.banned_until ? "banned" : "active",
        metadata: authUser?.user_metadata ?? null,
      };
    }) ?? [];

  return {
    users,
    page: Math.max(1, page),
    pageSize: PAGE_SIZE,
    total: count ?? users.length,
  };
}
