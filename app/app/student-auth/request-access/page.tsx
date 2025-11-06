import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { RequestAccessForm } from "@/components/student-auth/RequestAccessForm";

export const metadata: Metadata = {
  title: "Request Calendar Access | TutorLingua",
  description: "Create an account and request access to book lessons",
};

export default async function RequestAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ tutor?: string; tutor_id?: string }>;
}) {
  const params = await searchParams;

  if (!params.tutor || !params.tutor_id) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-cream via-brand-cream/40 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="mb-2 text-3xl font-bold text-brand-brown">
              TutorLingua
            </h1>
          </Link>
          <p className="text-gray-600">Request Calendar Access</p>
        </div>

        <div className="rounded-2xl border border-brand-brown/20 bg-white p-8 shadow-lg">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            Create your account
          </h2>
          <p className="mb-6 text-sm text-gray-600">
            You&apos;ll receive access to book lessons once your request is
            approved.
          </p>

          <RequestAccessForm
            tutorUsername={params.tutor}
            tutorId={params.tutor_id}
          />

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Already have an account?{" "}
              <Link
                href={`/student-auth/login?tutor=${params.tutor}`}
                className="font-semibold text-brand-brown hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            By creating an account, you agree to our{" "}
            <a href="/terms" className="text-brand-brown hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-brand-brown hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
