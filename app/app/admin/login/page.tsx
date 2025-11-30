import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { verifyAdminSession } from "@/lib/admin/auth";

export const metadata = {
  title: "Admin Login | TutorLingua",
  description: "Sign in to the TutorLingua admin dashboard",
};

export default async function AdminLoginPage() {
  // If already logged in as admin, redirect to dashboard
  const adminUser = await verifyAdminSession();
  if (adminUser) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <AdminLoginForm />

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} TutorLingua. All rights reserved.
        </p>
      </div>
    </div>
  );
}
