"use client";

import { useState, useTransition } from "react";
import { updateAutoHomeworkPreference } from "@/lib/actions/recording-review";

interface Props {
  initialPreference: "require_approval" | "auto_send";
}

export default function AIHomeworkPreferenceToggle({ initialPreference }: Props) {
  const [preference, setPreference] = useState(initialPreference);
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleToggle = () => {
    const newPreference = preference === "require_approval" ? "auto_send" : "require_approval";

    startTransition(async () => {
      const result = await updateAutoHomeworkPreference(newPreference);
      if (result.success) {
        setPreference(newPreference);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Toggle Section */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 pr-4">
          <h3 className="font-medium text-gray-900">
            Auto-send AI homework to students
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {preference === "auto_send"
              ? "AI-generated homework and drills are sent to students automatically after lesson analysis."
              : "AI-generated homework is saved as a draft for your review before sending to students."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
            ${preference === "auto_send" ? "bg-purple-600" : "bg-gray-200"}
            ${isPending ? "opacity-50 cursor-not-allowed" : ""}
          `}
          role="switch"
          aria-checked={preference === "auto_send"}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
              transition duration-200 ease-in-out
              ${preference === "auto_send" ? "translate-x-5" : "translate-x-0"}
            `}
          />
        </button>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-lg text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Preference saved
        </div>
      )}

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`p-4 rounded-lg border-2 transition-all ${preference === "require_approval" ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-white"}`}>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-medium text-gray-900">Review First</h4>
            {preference === "require_approval" && (
              <span className="ml-auto text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Active</span>
            )}
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>AI homework saved as drafts</li>
            <li>Review and edit before sending</li>
            <li>Full control over content</li>
            <li>Notification when analysis is ready</li>
          </ul>
        </div>

        <div className={`p-4 rounded-lg border-2 transition-all ${preference === "auto_send" ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-white"}`}>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h4 className="font-medium text-gray-900">Auto-Send</h4>
            {preference === "auto_send" && (
              <span className="ml-auto text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Active</span>
            )}
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Instant delivery to students</li>
            <li>Zero manual work required</li>
            <li>Students get homework faster</li>
            <li>Can still edit after sending</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
