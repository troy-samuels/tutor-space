"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupWithInviteLink } from "@/lib/actions/student-auth";
import { Eye, EyeOff, Loader2, CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";

interface InviteSignupFormProps {
  inviteToken: string;
  tutorUsername: string;
  tutorFullName: string | null;
  serviceIds: string[];
}

export function InviteSignupForm({
  inviteToken,
  tutorUsername,
  tutorFullName,
  serviceIds,
}: InviteSignupFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    acceptedTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const meetsLength = formData.password.length >= 8;
  const hasNumber = /\d/.test(formData.password);
  const hasLetter = /[A-Za-z]/.test(formData.password);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!formData.fullName.trim()) {
      setError("Please enter your name");
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (!formData.acceptedTerms) {
      setError("You must accept the Terms of Service and Privacy Policy");
      setLoading(false);
      return;
    }

    try {
      const result = await signupWithInviteLink({
        inviteToken,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim() || undefined,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      // Show success message
      setSuccess(true);

      // Build redirect URL with service scope if present
      const bookUrl = serviceIds.length > 0
        ? `/book/${tutorUsername}?services=${serviceIds.join(',')}`
        : `/book/${tutorUsername}`;

      // Redirect to booking page after 2 seconds
      setTimeout(() => {
        router.push(
          `/student/login?tutor=${tutorUsername}&redirect=${encodeURIComponent(bookUrl)}`
        );
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
          Welcome aboard!
        </h3>
        <p className="text-gray-600 mb-4">
          Your account has been created and you&apos;re ready to book with{" "}
          {tutorFullName || tutorUsername}.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting you to the booking page...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Invite benefit callout */}
      <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-green-800">
          <span className="font-medium">Special invite!</span> You&apos;ll be able to book
          immediately after signing up — no approval wait time.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder="Your full name"
          required
          disabled={loading}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder="you@example.com"
          required
          disabled={loading}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Create a password"
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Password requirements */}
        {formData.password.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className={`flex items-center gap-2 text-xs ${meetsLength ? 'text-green-600' : 'text-gray-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${meetsLength ? 'bg-green-500' : 'bg-gray-300'}`} />
              At least 8 characters
            </div>
            <div className={`flex items-center gap-2 text-xs ${hasLetter ? 'text-green-600' : 'text-gray-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${hasLetter ? 'bg-green-500' : 'bg-gray-300'}`} />
              Contains a letter
            </div>
            <div className={`flex items-center gap-2 text-xs ${hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-green-500' : 'bg-gray-300'}`} />
              Contains a number
            </div>
          </div>
        )}
      </div>

      {/* Phone (optional) */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder="+1 (555) 123-4567"
          disabled={loading}
        />
      </div>

      {/* Terms checkbox */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="acceptedTerms"
          name="acceptedTerms"
          checked={formData.acceptedTerms}
          onChange={handleChange}
          className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          disabled={loading}
        />
        <label htmlFor="acceptedTerms" className="text-sm text-gray-600">
          I agree to the{" "}
          <Link href="/terms" target="_blank" className="text-indigo-600 hover:text-indigo-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="text-indigo-600 hover:text-indigo-700">
            Privacy Policy
          </Link>
        </label>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account & Book"
        )}
      </button>
    </form>
  );
}
