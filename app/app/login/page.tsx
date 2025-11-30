import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Tutor Login | TutorLingua",
  description: "Sign in to manage your TutorLingua workspace.",
};

export default async function TutorLoginPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-muted/30 to-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white/90 p-8 shadow-lg backdrop-blur">
        <header className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold text-primary">
            {t("brandTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("dashboardSubtitle")}</p>
        </header>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          {t("studentAccessQuestion")}{" "}
          <Link
            href="/student-auth/login"
            className="font-semibold text-primary hover:underline"
          >
            {t("studentLoginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
