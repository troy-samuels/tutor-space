import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/forms/login-form";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Tutor Login | TutorLingua",
  description: "Sign in to manage your TutorLingua workspace.",
};

export default async function TutorLoginPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-muted/30 to-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white/90 p-8 shadow-lg backdrop-blur">
        <header className="space-y-3 text-center">
          <div className="flex justify-center">
            <Logo href="/dashboard" variant="wordmark" className="h-10 sm:h-12" />
          </div>
          <p className="text-sm text-muted-foreground">{t("dashboardSubtitle")}</p>
        </header>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          {t("studentAccessQuestion")}{" "}
          <Link
            href="/student/login"
            className="font-semibold text-primary hover:underline"
          >
            {t("studentLoginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
