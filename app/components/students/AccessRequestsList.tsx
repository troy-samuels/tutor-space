"use client";

import { useState } from "react";
import { AccessRequestCard } from "./AccessRequestCard";

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  calendar_access_status: string;
  created_at: string;
}

interface AccessRequest {
  id: string;
  status: string;
  requested_at: string;
  resolved_at: string | null;
  tutor_notes: string | null;
  student_message: string | null;
  students: Student;
}

interface AccessRequestsListProps {
  pending: AccessRequest[];
  approved: AccessRequest[];
  denied: AccessRequest[];
}

export function AccessRequestsList({
  pending: initialPending,
  approved: initialApproved,
  denied: initialDenied,
}: AccessRequestsListProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "denied">("pending");
  const [pending, setPending] = useState(initialPending);
  const [approved, setApproved] = useState(initialApproved);
  const [denied, setDenied] = useState(initialDenied);

  const tabs = [
    { id: "pending" as const, label: "Pending", count: pending.length, color: "yellow" },
    { id: "approved" as const, label: "Approved", count: approved.length, color: "green" },
    { id: "denied" as const, label: "Denied", count: denied.length, color: "red" },
  ];

  const currentRequests = {
    pending,
    approved,
    denied,
  }[activeTab];

  function handleRequestUpdate(requestId: string, newStatus: "approved" | "denied") {
    // Find and remove from current list
    const request = pending.find((r) => r.id === requestId);
    if (!request) return;

    setPending((prev) => prev.filter((r) => r.id !== requestId));

    // Add to appropriate list
    const updatedRequest = { ...request, status: newStatus, resolved_at: new Date().toISOString() };
    if (newStatus === "approved") {
      setApproved((prev) => [updatedRequest, ...prev]);
    } else {
      setDenied((prev) => [updatedRequest, ...prev]);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            // Use static class names instead of dynamic for Tailwind purging
            const badgeClasses = isActive
              ? tab.id === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : tab.id === "approved"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600";

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors
                  ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {tab.label}
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${badgeClasses}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {currentRequests.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-xl border border-gray-200">
            <svg
              className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab} requests
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === "pending"
                ? "You're all caught up! New access requests will appear here."
                : `No ${activeTab} requests yet.`}
            </p>
          </div>
        ) : (
          currentRequests.map((request) => (
            <AccessRequestCard
              key={request.id}
              request={request}
              onUpdate={handleRequestUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}
