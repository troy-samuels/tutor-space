import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignupForm } from "@/components/forms/signup-form";
import { SignupBillingToggle } from "@/components/pricing/SignupBillingToggle";

export const metadata: Metadata = {
  title: "Create Tutor Account | TutorLingua",
  description: "Set up your TutorLingua workspace in minutes.",
};

export default async function TutorSignupPage() {
  const t = await getTranslations("tutorSignupPage");

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-muted/40 to-white px-6 py-12">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center space-y-8">
        <div className="w-full text-center text-sm text-muted-foreground">
          <p>
            {t("ctaLoginPrefix")}{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t("ctaLogin")}
            </Link>
          </p>
        </div>

        <header className="w-full space-y-3 text-center">
          <h1 className="text-4xl font-semibold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">{t("subtitle")}</p>
        </header>

        <SignupBillingToggle />

        <div className="w-full">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
