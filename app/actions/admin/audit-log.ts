"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin/get-admin-user";
import type { AuditLogEntry, AuditLogResult } from "@/actions/admin/types";

const PAGE_SIZE = 50;

export async function getAuditLogForAdmin(
  page = 1
): Promise<AuditLogResult> {
  const admin = await getAdminUser();
  if (!admin || admin.role !== "super_admin") {
    throw new Error("Super admin privileges required");
  }

  const supabaseAdmin = createServiceRoleClient();
  if (!supabaseAdmin) {
    throw new Error("Supabase service role is not configured");
  }

  const offset = Math.max(0, page - 1) * PAGE_SIZE;

  const { data, error, count } = await supabaseAdmin
    .from("admin_audit_log")
    .select(
      `
        id,
        action,
        target_type,
        target_id,
        metadata,
        ip_address,
        user_agent,
        created_at,
        admin_user:admin_users (
          full_name,
          role
        )
      `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    throw new Error(`Failed to fetch audit log: ${error.message}`);
  }

  const entries: AuditLogEntry[] =
    data?.map((row) => {
      const adminUser = (row as any).admin_user as
        | { full_name: string | null; role: string | null }
        | null;

      return {
        id: row.id,
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        adminName: adminUser?.full_name ?? null,
        adminRole: adminUser?.role ?? null,
        createdAt: row.created_at,
      };
    }) ?? [];

  return {
    entries,
    page: Math.max(1, page),
    pageSize: PAGE_SIZE,
    total: count ?? entries.length,
  };
}
