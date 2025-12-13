import type { User } from "@supabase/supabase-js";

export type AdminRole = "super_admin" | "admin" | "support";

export interface AdminUserRow {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserWithAuth extends AdminUserRow {
  auth_user?: Pick<User, "id" | "email">;
}
