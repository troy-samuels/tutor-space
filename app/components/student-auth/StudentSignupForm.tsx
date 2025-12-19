"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { studentSignup } from "@/lib/actions/student-auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { detectUserTimezone } from "@/lib/utils/timezones";
import confetti from "canvas-confetti";

export function StudentSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tutorParam = searchParams.get("tutor");
  const t = useTranslations("studentForms");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState(detectUserTimezone());
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const meetsLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[A-Za-z]/.test(password);

  // Trigger shake on error
  useEffect(() => {
    if (error) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!acceptTerms) {
      setError(t("errorAcceptTerms"));
      return;
    }

    setLoading(true);

    try {
      const result = await studentSignup({
        email,
        password,
        fullName,
        timezone,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Show celebration before redirect
      setShowCelebration(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      // Send students to the search page with the tutor prefilled (if provided)
      const redirectUrl = tutorParam
        ? `/student/search?prefill=${encodeURIComponent(tutorParam)}`
        : "/student/search";

      // Delay redirect to show celebration
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 1500);
    } catch {
      setError(t("unexpectedError"));
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className={`space-y-5 ${isShaking ? "animate-shake" : ""}`}>
        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-200">
            {error}
          </div>
        )}

      {/* Full Name Field */}
      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-foreground mb-2"
        >
          {t("fullName")}
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder={t("fullNamePlaceholder")}
        />
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground mb-2"
        >
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder={t("emailPlaceholder")}
        />
      </div>

      {/* Timezone Field */}
      <div>
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Timezone
        </label>
        <TimezoneSelect
          id="timezone"
          value={timezone}
          onChange={setTimezone}
          autoDetect
          showCurrentTime={false}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          We auto-detected your timezone. Switch if you&apos;re booking from elsewhere.
        </p>
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground mb-2"
        >
          {t("password")}
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
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition pr-12"
            placeholder={t("passwordNewPlaceholder")}
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

      {/* Terms Acceptance */}
      <div className="flex items-start gap-3">
        <input
            type="checkbox"
            id="terms"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
        <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
          {t("termsPrefix")}{" "}
          <Link
            href="/terms"
            target="_blank"
            className="text-primary font-medium hover:underline"
          >
            {t("terms")}
          </Link>{" "}
          {t("and")}{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="text-primary font-medium hover:underline"
          >
            {t("privacy")}
          </Link>
          .
          <span className="mt-1 block text-xs text-muted-foreground">
            {t("termsNote")}
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || showCelebration}
        className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("creatingAccount")}
          </>
        ) : (
          t("createAccount")
        )}
      </button>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        {t("alreadyHave")}{" "}
        <Link
          href={tutorParam ? `/student/login?tutor=${tutorParam}` : "/student/login"}
          className="text-primary font-medium hover:underline"
        >
          {t("signIn")}
        </Link>
      </p>
      </form>

      {showCelebration && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 rounded-xl animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-3 animate-in zoom-in-50 duration-300">
            <span className="text-6xl" role="img" aria-label="celebration">
              🎉
            </span>
            <p className="text-lg font-semibold text-foreground">
              Welcome aboard!
            </p>
          </div>
        </div>
      )}
    </div>
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
