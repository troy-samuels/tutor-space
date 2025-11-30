"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { studentSignup } from "@/lib/actions/student-auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function StudentSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tutorParam = searchParams.get("tutor");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!acceptTerms) {
      setError("Please accept the Terms & Conditions and Privacy Notice");
      return;
    }

    setLoading(true);

    try {
      const result = await studentSignup({
        email,
        password,
        fullName,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Send students to the search page with the tutor prefilled (if provided)
      const redirectUrl = tutorParam
        ? `/student-auth/search?prefill=${encodeURIComponent(tutorParam)}`
        : "/student-auth/search";
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Full Name Field */}
      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder="Your full name"
        />
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder="you@example.com"
        />
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition pr-12"
            placeholder="At least 8 characters"
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

      {/* Terms Acceptance */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
        />
        <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
          I agree to the{" "}
          <Link
            href="/terms"
            target="_blank"
            className="text-primary font-medium hover:underline"
          >
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="text-primary font-medium hover:underline"
          >
            Privacy Notice
          </Link>
          .
          <span className="mt-1 block text-xs text-gray-500">
            I understand TutorLingua only facilitates connections and is not a party to, nor liable
            for, any agreements between tutors and students.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </button>

      {/* Login Link */}
      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href={tutorParam ? `/student-auth/login?tutor=${tutorParam}` : "/student-auth/login"}
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
