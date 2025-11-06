import { Metadata } from "next";
import { RequestAccessForm } from "@/components/student-auth/RequestAccessForm";
import Link from "next/link";
import { redirect } from "next/navigation";

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

  // Require tutor parameter
  if (!params.tutor || !params.tutor_id) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-brand-cream/40 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-brand-brown mb-2">
              TutorLingua
            </h1>
          </Link>
          <p className="text-gray-600">Request Calendar Access</p>
        </div>

        {/* Request Access Card */}
        <div className="bg-white rounded-2xl border border-brand-brown/20 shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Create your account
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            You&apos;ll receive access to book lessons once your request is approved.
          </p>

          <RequestAccessForm
            tutorUsername={params.tutor}
            tutorId={params.tutor_id}
          />

          {/* Footer Links */}
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

        {/* Help Text */}
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
