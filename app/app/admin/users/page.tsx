import { redirect } from "next/navigation";
import { getUsersForAdmin } from "@/actions/admin/users";
import { AdminUsersTable } from "@/components/admin/users/AdminUsersTable";
import { getAdminUser } from "@/lib/admin/get-admin-user";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
    search?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect("/admin/login");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const pageParam = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search ?? "";

  const result = await getUsersForAdmin(pageParam, { search });

  return (
    <AdminUsersTable
      users={result.users}
      page={result.page}
      pageSize={result.pageSize}
      total={result.total}
      initialSearch={search}
    />
  );
}
