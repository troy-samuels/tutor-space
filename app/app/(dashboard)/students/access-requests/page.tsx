import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AccessRequestsList } from "@/components/students/AccessRequestsList";

export const metadata = {
  title: "Student Access Requests | TutorLingua",
  description: "Manage student calendar access requests",
};

export default async function AccessRequestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all access requests for this tutor
  const { data: requests, error } = await supabase
    .from("student_access_requests")
    .select(
      `
      id,
      status,
      requested_at,
      resolved_at,
      tutor_notes,
      student_message,
      students (
        id,
        full_name,
        email,
        phone,
        calendar_access_status,
        created_at
      )
    `
    )
    .eq("tutor_id", user.id)
    .order("requested_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch access requests:", error);
  }

  // Separate by status
  const pending = requests?.filter((r) => r.status === "pending") || [];
  const approved = requests?.filter((r) => r.status === "approved") || [];
  const denied = requests?.filter((r) => r.status === "denied") || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Access Requests</h1>
        <p className="mt-2 text-gray-600">
          Review and manage student requests to access your booking calendar.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Pending</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-900">{pending.length}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Approved</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900">{approved.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Denied</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-900">{denied.length}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <AccessRequestsList
        pending={pending}
        approved={approved}
        denied={denied}
      />
    </div>
  );
}
