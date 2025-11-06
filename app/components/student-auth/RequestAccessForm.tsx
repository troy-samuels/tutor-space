"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupAndRequestAccess } from "@/lib/actions/student-auth";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

interface RequestAccessFormProps {
  tutorUsername: string;
  tutorId: string;
}

export function RequestAccessForm({
  tutorUsername,
  tutorId,
}: RequestAccessFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    message: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const result = await signupAndRequestAccess({
        tutorId,
        tutorUsername,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        studentMessage: formData.message || undefined,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Show success message
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/student-auth/login?tutor=${tutorUsername}`);
      }, 2000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Request Submitted!
        </h3>
        <p className="text-gray-600 mb-4">
          You&apos;ll receive an email once your tutor approves your access.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Full name *
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          value={formData.fullName}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent transition"
          placeholder="John Doe"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email address *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent transition"
          placeholder="you@example.com"
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Password *
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent transition pr-12"
            placeholder="••••••••"
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Must be at least 8 characters
        </p>
      </div>

      {/* Phone (Optional) */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Phone number
          <span className="text-gray-500 font-normal ml-1">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent transition"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      {/* Message to Tutor (Optional) */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Message to tutor
          <span className="text-gray-500 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          value={formData.message}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent transition resize-none"
          placeholder="Tell your tutor a bit about your learning goals..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-brown text-white py-3 px-4 rounded-lg font-semibold hover:bg-brand-brown/90 focus:outline-none focus:ring-2 focus:ring-brand-brown focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting request...
          </>
        ) : (
          "Request Access"
        )}
      </button>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>What happens next?</strong>
          <br />
          Your tutor will review your request and send you payment instructions.
          Once approved, you&apos;ll be able to book lessons directly from the calendar.
        </p>
      </div>
    </form>
  );
}
