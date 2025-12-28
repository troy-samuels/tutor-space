"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupAndRequestAccess } from "@/lib/actions/student-auth";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

interface RequestAccessFormProps {
  tutorUsername: string;
  tutorId: string;
  initialEmail?: string;
  initialName?: string;
}

export function RequestAccessForm({
  tutorUsername,
  tutorId,
  initialEmail,
  initialName,
}: RequestAccessFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(() => ({
    fullName: initialName || "",
    email: initialEmail || "",
    password: "",
    phone: "",
    message: "",
    acceptedTerms: false,
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const meetsLength = formData.password.length >= 8;
  const hasNumber = /\d/.test(formData.password);
  const hasLetter = /[A-Za-z]/.test(formData.password);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
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

    if (!formData.acceptedTerms) {
      setError("You must accept the Terms of Service and Privacy Policy to continue");
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

      // Handle redirect if returned (for future flexibility)
      if ("redirectTo" in result && typeof result.redirectTo === "string") {
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      // Show success message
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        const redirectTarget = `/book/${tutorUsername}`;
        router.push(
          `/student/login?tutor=${tutorUsername}&redirect=${encodeURIComponent(redirectTarget)}`
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
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Request Submitted!
        </h3>
        <p className="text-muted-foreground mb-4">
          You&apos;ll receive an email once your tutor approves your access.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-foreground mb-2"
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
          className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder="John Doe"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground mb-2"
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
          className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder="you@example.com"
        />
        {initialEmail && (
          <p className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            We pre-filled this from your tutor&apos;s invite. Use a different email if needed.
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground mb-2"
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
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition pr-12"
          placeholder="••••••••"
          minLength={8}
        />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
          <PasswordHint label="8+ chars" ok={meetsLength} />
          <PasswordHint label="Letter" ok={hasLetter} />
          <PasswordHint label="Number" ok={hasNumber} />
        </div>
      </div>

      {/* Phone (Optional) */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Phone number
          <span className="text-muted-foreground font-normal ml-1">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      {/* Message to Tutor (Optional) */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Message to tutor
          <span className="text-muted-foreground font-normal ml-1">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          value={formData.message}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none"
          placeholder="Tell your tutor a bit about your learning goals..."
        />
      </div>

      {/* Terms and Privacy Acceptance */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="acceptedTerms"
          name="acceptedTerms"
          checked={formData.acceptedTerms}
          onChange={handleChange}
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
          required
        />
        <label htmlFor="acceptedTerms" className="text-sm text-foreground cursor-pointer">
          I agree to the{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            Privacy Policy
          </a>
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
            Submitting request...
          </>
        ) : (
          "Request Access"
        )}
      </button>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => {
            const redirectTarget = `/book/${tutorUsername}`;
            router.push(
              `/student/login?tutor=${tutorUsername}&redirect=${encodeURIComponent(
                redirectTarget
              )}`
            );
          }}
          className="text-primary font-semibold hover:underline"
        >
          Log in instead
        </button>
      </div>

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

function PasswordHint({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full border px-2 py-1 font-semibold uppercase tracking-wide",
        ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border bg-muted text-muted-foreground",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
