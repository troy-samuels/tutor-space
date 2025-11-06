import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import { Users, ArrowRight } from "lucide-react";

type PendingRequest = {
  id: string;
  requested_at: string;
  students: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export async function PendingAccessRequestsWidget() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch pending requests
  const { data: requests, count } = await supabase
    .from("student_access_requests")
    .select(
      `
      id,
      requested_at,
      students (
        full_name,
        email
      )
    `,
      { count: "exact" }
    )
    .eq("tutor_id", user.id)
    .eq("status", "pending")
    .order("requested_at", { ascending: false })
    .limit(3);

  if (!count || count === 0) {
    return null;
  }

  const pendingRequests = (requests ?? []) as PendingRequest[];

  return (
    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-yellow-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-900">
              Pending Access Requests
            </h3>
            <p className="text-sm text-yellow-700">
              {count} {count === 1 ? "student" : "students"} waiting for approval
            </p>
          </div>
        </div>
        <Link
          href="/students/access-requests"
          className="text-sm font-semibold text-yellow-700 hover:text-yellow-800 flex items-center gap-1"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-2">
        {pendingRequests.slice(0, 3).map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-lg p-3 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {request.students?.full_name}
              </p>
              <p className="text-xs text-gray-500">{request.students?.email}</p>
            </div>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(request.requested_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        ))}
      </div>

      <Link
        href="/students/access-requests"
        className="mt-4 w-full inline-flex items-center justify-center bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition"
      >
        Review Requests
      </Link>
    </div>
  );
}
