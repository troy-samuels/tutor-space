import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { RequestAccessForm } from "@/components/student-auth/RequestAccessForm";

export const metadata: Metadata = {
  title: "Complete Your Profile | TutorLingua",
  description: "Finish setting up your student account to book lessons with your tutor.",
};

export default async function RequestAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ tutor?: string; tutor_id?: string; email?: string; name?: string }>;
}) {
  const t = await getTranslations("requestAccessPage");
  const params = await searchParams;
  const tutorUsernameParam = params.tutor;
  const tutorIdParam = params.tutor_id;

  if (!tutorUsernameParam && !tutorIdParam) {
    redirect("/student/signup");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("profiles")
    .select("id, username, full_name, tagline, avatar_url, email")
    .eq("role", "tutor");

  if (tutorIdParam) {
    query = query.eq("id", tutorIdParam);
  } else if (tutorUsernameParam) {
    query = query.eq("username", tutorUsernameParam);
  }

  const { data: tutor } = await query.single();

  if (!tutor) {
    notFound();
  }

  const tutorUsername = tutor.username || tutorUsernameParam || "";

  if (user && tutorUsername) {
    redirect(`/book/${tutorUsername}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-muted/40 to-white">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-6">
        <Link
          href={tutorUsername ? `/book/${tutorUsername}` : "/"}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              {tutor.avatar_url ? (
                <Image
                  src={tutor.avatar_url}
                  alt={tutor.full_name || tutor.username || "Tutor"}
                  width={72}
                  height={72}
                  className="h-16 w-16 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground">
                  {(tutor.full_name || tutor.username || "T")[0]}
                </div>
              )}
                <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("tutorLabel")}</p>
                <h1 className="text-xl font-semibold text-foreground">
                  {tutor.full_name || tutor.username || "Your tutor"}
                </h1>
                {tutor.tagline && <p className="text-sm text-muted-foreground">{tutor.tagline}</p>}
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{t("cardTitle")}</p>
                  <p>{t("cardBody")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{t("fastPathTitle")}</p>
                  <p>{t("fastPathBody")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-md">
            <h2 className="text-lg font-semibold text-foreground mb-1">{t("formTitle")}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t("formSubtitle", { tutorName: tutor.full_name || "your tutor" })}
            </p>
            <RequestAccessForm
              tutorUsername={tutorUsername}
              tutorId={tutor.id}
              initialEmail={params.email || undefined}
              initialName={params.name || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
