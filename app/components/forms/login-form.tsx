"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { signIn } from "@/lib/actions/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { FormStatusAlert } from "@/components/forms/form-status-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { useAuthForm } from "@/components/forms/use-auth-form";

export function LoginForm() {
  const [state, formAction, isPending] = useAuthForm(signIn);
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
          {t("identifierLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="text"
          required
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder={t("identifierPlaceholder")}
          autoComplete="username"
        />
      </div>

      <div className="space-y-2">
        <PasswordInput
          id="password"
          name="password"
          label={t("passwordLabel")}
          required
          minLength={6}
          autoComplete="current-password"
          fieldClassName="space-y-2"
          labelClassName="block text-sm font-medium text-foreground"
          containerClassName="relative"
          inputClassName="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          buttonClassName="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground"
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
        />
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
      </div>

      <FormStatusAlert
        tone="error"
        variant="inline"
        message={state?.error}
        ariaLive="polite"
        icon={<XCircle className="h-4 w-4 flex-shrink-0" />}
      />

      <FormStatusAlert
        tone="success"
        variant="inline"
        message={state?.success}
        ariaLive="polite"
        className="text-xs"
        icon={<CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
        visuallyHidden
      />

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
