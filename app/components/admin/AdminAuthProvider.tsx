"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AdminRole } from "@/lib/admin/types";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  role: AdminRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  canViewFinancials: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  admin: null,
  role: null,
  isSuperAdmin: false,
  isAdmin: false,
  isSupport: false,
  canViewFinancials: false,
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function AdminAuthProvider({
  children,
  initialAdmin,
}: {
  children: ReactNode;
  initialAdmin: AdminUser | null;
}) {
  const role = initialAdmin?.role ?? null;
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "super_admin" || role === "admin";
  const isSupport = role === "support";
  const canViewFinancials = isSuperAdmin || isAdmin;

  return (
    <AdminAuthContext.Provider
      value={{
        admin: initialAdmin,
        role,
        isSuperAdmin,
        isAdmin,
        isSupport,
        canViewFinancials,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
