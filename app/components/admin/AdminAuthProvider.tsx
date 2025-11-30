"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: "super_admin" | "admin" | "support";
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  admin: null,
  isSuperAdmin: false,
  isAdmin: false,
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
  const isSuperAdmin = initialAdmin?.role === "super_admin";
  const isAdmin = initialAdmin?.role === "super_admin" || initialAdmin?.role === "admin";

  return (
    <AdminAuthContext.Provider
      value={{
        admin: initialAdmin,
        isSuperAdmin,
        isAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
