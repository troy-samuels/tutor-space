"use client";

import Link from "next/link";
import { useActionState, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { signIn, type AuthActionState } from "@/lib/actions/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const initialState: AuthActionState = {
  error: undefined,
  success: undefined,
  redirectTo: undefined,
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    signIn,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";
  const router = useRouter();

  // Handle client-side redirect after successful login
  useEffect(() => {
    if (state?.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state?.redirectTo, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="redirect" value={redirect} />
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          {t("passwordLabel")}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            className="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            autoComplete={showPassword ? "off" : "current-password"}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
      >
        {isPending ? t("signingIn") : common("login")}
      </button>

      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-2 text-xs uppercase text-muted-foreground">
              {t("orContinue")}
            </span>
          </div>
        </div>
        <GoogleSignInButton redirectTo={redirect || undefined} />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccountCta")}{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          {t("createOne")}
        </Link>
      </p>
    </form>
  );
}
