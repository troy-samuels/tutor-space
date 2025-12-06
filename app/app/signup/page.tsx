import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignupForm } from "@/components/forms/signup-form";
import { SignupPricingHighlight } from "@/components/pricing/SignupPricingHighlight";

export const metadata: Metadata = {
  title: "Create Tutor Account | TutorLingua",
  description: "Set up your TutorLingua workspace in minutes.",
};

export default async function TutorSignupPage() {
  const t = await getTranslations("tutorSignupPage");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-muted/30 to-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white/90 p-8 shadow-lg backdrop-blur">
        <header className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold text-primary">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </header>

        <SignupPricingHighlight />

        <SignupForm />

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
