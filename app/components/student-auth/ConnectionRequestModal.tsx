"use client";

import { useState } from "react";
import { X, Loader2, Send } from "lucide-react";
import { requestConnection } from "@/lib/actions/student-connections";

interface ConnectionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  onSuccess?: () => void;
}

export function ConnectionRequestModal({
  isOpen,
  onClose,
  tutor,
  onSuccess,
}: ConnectionRequestModalProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await requestConnection({
        tutorId: tutor.id,
        message,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setMessage("");
        onSuccess?.();
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError("");
      setMessage("");
      setSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Connect with {tutor.full_name || `@${tutor.username}`}</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          {success ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Request Sent!</h3>
              <p className="mt-1 text-sm text-gray-500">
                {tutor.full_name || `@${tutor.username}`} will review your request.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Send a message to introduce yourself. This is your one chance to make a
                great first impression!
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi! I'm interested in learning with you. I'm looking to improve my..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition"
                  required
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Be friendly and specific about your goals</span>
                  <span>{message.length}/500</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || message.trim().length < 10}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
