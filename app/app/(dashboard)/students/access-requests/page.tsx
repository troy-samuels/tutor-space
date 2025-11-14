import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ComponentProps } from "react";
import { AccessRequestsList } from "@/components/students/AccessRequestsList";

export const metadata = {
  title: "Student Access Requests | TutorLingua",
  description: "Manage student calendar access requests",
};

type AccessRequestsListProps = ComponentProps<typeof AccessRequestsList>;
type AccessRequestShape = AccessRequestsListProps["pending"][number];

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

  const normalizedRequests: AccessRequestShape[] =
    (requests ?? [])
      .map((request) => {
        const student = Array.isArray(request.students)
          ? request.students[0]
          : request.students;

        if (!student) {
          return null;
        }

        return {
          id: request.id,
          status: request.status,
          requested_at: request.requested_at ?? new Date().toISOString(),
          resolved_at: request.resolved_at ?? null,
          tutor_notes: request.tutor_notes ?? null,
          student_message: request.student_message ?? null,
          students: {
            id: student.id ?? "",
            full_name: student.full_name ?? "Student",
            email: student.email ?? "",
            phone: student.phone ?? null,
            calendar_access_status: student.calendar_access_status ?? "pending",
            created_at: student.created_at ?? new Date().toISOString(),
          },
        } satisfies AccessRequestShape;
      })
      .filter((request): request is AccessRequestShape => Boolean(request));

  // Separate by status
  const pending = normalizedRequests.filter((r) => r.status === "pending");
  const approved = normalizedRequests.filter((r) => r.status === "approved");
  const denied = normalizedRequests.filter((r) => r.status === "denied");

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
