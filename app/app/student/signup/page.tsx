import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { StudentSignupForm } from "@/components/student-auth/StudentSignupForm";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Student Sign Up | TutorLingua",
  description: "Create a student account to find tutors and book lessons",
};

export default async function StudentSignupPage() {
  const t = await getTranslations("studentSignupPage");

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
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            {t("createTitle")}
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            {t("createSubtitle")}
          </p>

          <StudentSignupForm />
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            {t("ctaTutorPrefix")}{" "}
            <Link href="/signup" className="text-primary hover:underline">
              {t("ctaTutor")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
