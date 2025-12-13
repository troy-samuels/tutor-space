import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { StudentLoginForm } from "@/components/student-auth/StudentLoginForm";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Student Login | TutorLingua",
  description: "Log in to access your lessons and booking calendar",
};

export default async function StudentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tutor?: string; redirect?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const params = await searchParams;
    const requestedRedirect = params?.redirect ?? "";
    const safeRedirect =
      requestedRedirect &&
      requestedRedirect.startsWith("/") &&
      !requestedRedirect.startsWith("//") &&
      !requestedRedirect.includes("://")
        ? requestedRedirect
        : null;

    let role: string | null =
      (user.user_metadata as { role?: string } | null)?.role ?? null;

    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      role = (profile?.role as string | null) ?? null;
    }

    if (role === "tutor") {
      redirect("/dashboard");
    }

    const target =
      safeRedirect || (params?.tutor ? `/book/${params.tutor}` : "/student/search");

    redirect(target);
  }

  const t = await getTranslations("studentLoginPage");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center">
            <Logo variant="wordmark" />
          </Link>
          <p className="text-muted-foreground">{t("title")}</p>
        </div>

        <div className="rounded-3xl border border-border bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            {t("welcome")}
          </h2>

          <StudentLoginForm searchParams={searchParams} />

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              {t("ctaSignupPrefix")}{" "}
              <Link
                href="/student/signup"
                className="font-semibold text-primary hover:underline"
              >
                {t("ctaSignup")}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
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
