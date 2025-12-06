import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password | TutorLingua",
  description: "Request a password reset link for your tutor account.",
};

export default async function ForgotPasswordPage() {
  const t = await getTranslations("forgotPasswordPage");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-muted/30 to-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-white/90 p-8 shadow-lg backdrop-blur">
        <header className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold text-primary">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </header>

        <ForgotPasswordForm />

        <p className="text-center text-sm text-muted-foreground">
          {t("ctaLoginPrefix")}{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t("ctaLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
