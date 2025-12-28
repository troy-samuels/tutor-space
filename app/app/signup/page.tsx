import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignupPageClient } from "@/components/pricing/SignupPageClient";

export const metadata: Metadata = {
  title: "Create Tutor Account | TutorLingua",
  description: "Set up your TutorLingua workspace in minutes.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TutorSignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const checkoutCancelled = params.checkout === "cancelled";
  const initialTier = params.tier === "studio" ? "studio" : "pro";
  const initialBilling = params.billing === "annual" ? "annual" : "monthly";
  const checkoutSessionId =
    typeof params.session_id === "string" ? params.session_id : undefined;
  const lifetimeIntent = params.lifetime === "true" || params.lifetime === "1";
  const lifetimeSource =
    typeof params.source === "string" ? params.source : undefined;
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

        <SignupPageClient
          checkoutCancelled={checkoutCancelled}
          initialTier={initialTier}
          initialBilling={initialBilling}
          checkoutSessionId={checkoutSessionId}
          lifetimeIntent={lifetimeIntent}
          lifetimeSource={lifetimeSource}
        />
      </div>
    </div>
  );
}
