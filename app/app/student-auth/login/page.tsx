import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { StudentLoginForm } from "@/components/student-auth/StudentLoginForm";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Student Login | TutorLingua",
  description: "Log in to access your lessons and booking calendar",
};

export default async function StudentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tutor?: string; redirect?: string }>;
}) {
  const t = await getTranslations("studentLoginPage");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-muted/40 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center">
            <Logo variant="wordmark" />
          </Link>
          <p className="text-gray-600">{t("title")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            {t("welcome")}
          </h2>

          <StudentLoginForm searchParams={searchParams} />

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              {t("ctaSignupPrefix")}{" "}
              <Link
                href="/student-auth/signup"
                className="font-semibold text-primary hover:underline"
              >
                {t("ctaSignup")}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            {t("ctaTutorPrefix")}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t("ctaTutor")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
