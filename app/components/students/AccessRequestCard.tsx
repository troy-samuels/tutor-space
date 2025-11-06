"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { approveStudentAccess, denyStudentAccess } from "@/lib/actions/tutor-students";
import { Mail, Phone, Calendar, Loader2, CheckCircle, XCircle, MessageSquare } from "lucide-react";

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

interface AccessRequestCardProps {
  request: AccessRequest;
  onUpdate: (requestId: string, newStatus: "approved" | "denied") => void;
}

export function AccessRequestCard({ request, onUpdate }: AccessRequestCardProps) {
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const isPending = request.status === "pending";
  const student = request.students;

  async function handleApprove() {
    setLoading(true);
    setError("");

    const result = await approveStudentAccess({
      requestId: request.id,
      studentId: student.id,
      notes: notes || undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onUpdate(request.id, "approved");
    setLoading(false);
  }

  async function handleDeny() {
    if (!notes) {
      setError("Please provide a reason for denial");
      return;
    }

    setLoading(true);
    setError("");

    const result = await denyStudentAccess({
      requestId: request.id,
      studentId: student.id,
      reason: notes,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onUpdate(request.id, "denied");
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{student.full_name}</h3>
          <p className="text-sm text-gray-500">
            Requested {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
          </p>
        </div>
        {!isPending && (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${
              request.status === "approved"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {request.status === "approved" ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        )}
      </div>

      {/* Student Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-xs sm:text-sm text-gray-600">
          <Mail className="h-4 w-4 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" />
          <a href={`mailto:${student.email}`} className="hover:text-brand-brown">
            {student.email}
          </a>
        </div>
        {student.phone && (
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" />
            <a href={`tel:${student.phone}`} className="hover:text-brand-brown">
              {student.phone}
            </a>
          </div>
        )}
        <div className="flex items-center text-xs sm:text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" />
          Account created {formatDistanceToNow(new Date(student.created_at), { addSuffix: true })}
        </div>
      </div>

      {/* Student Message */}
      {request.student_message && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-900 mb-1">Message from student:</p>
              <p className="text-sm text-blue-800">{request.student_message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tutor Notes (for resolved requests) */}
      {!isPending && request.tutor_notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-1">Your notes:</p>
          <p className="text-sm text-gray-600">{request.tutor_notes}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Actions for Pending Requests */}
      {isPending && (
        <div className="space-y-3">
          {/* Notes Input */}
          {showNotes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional for approval, required for denial)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent text-sm sm:text-base"
                placeholder="Add notes about this request, payment instructions, etc."
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approve
            </button>

            <button
              onClick={handleDeny}
              disabled={loading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Deny
            </button>

            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition"
            >
              {showNotes ? "Hide" : "Add"} Notes
            </button>
          </div>
        </div>
      )}

      {/* Resolved Status */}
      {!isPending && request.resolved_at && (
        <p className="text-xs text-gray-500">
          {request.status === "approved" ? "Approved" : "Denied"}{" "}
          {formatDistanceToNow(new Date(request.resolved_at), { addSuffix: true })}
        </p>
      )}
    </div>
  );
}
