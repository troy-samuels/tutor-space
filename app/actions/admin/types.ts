export type AuditLogEntry = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  adminName: string | null;
  adminRole: string | null;
  createdAt: string;
};

export type AuditLogResult = {
  entries: AuditLogEntry[];
  page: number;
  pageSize: number;
  total: number;
};

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
