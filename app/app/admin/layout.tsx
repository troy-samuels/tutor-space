import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";
import { getAdminUser } from "@/lib/admin/get-admin-user";

export const metadata = {
  title: "Admin Dashboard | TutorLingua",
  description: "TutorLingua platform administration dashboard",
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/admin/login");
  }

  return (
    <AdminAuthProvider
      initialAdmin={{
        id: adminUser.id,
        email: adminUser.auth_user?.email ?? "",
        fullName: adminUser.full_name ?? "",
        role: adminUser.role,
      }}
    >
      <AdminLayout>{children}</AdminLayout>
    </AdminAuthProvider>
  );
}
