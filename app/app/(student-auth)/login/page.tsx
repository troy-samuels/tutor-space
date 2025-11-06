import { Metadata } from "next";
import { StudentLoginForm } from "@/components/student-auth/StudentLoginForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Student Login | TutorLingua",
  description: "Log in to access your lessons and booking calendar",
};

export default function StudentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tutor?: string; redirect?: string }>;
}) {
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
          <p className="text-gray-600">Student Login</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl border border-brand-brown/20 shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Welcome back
          </h2>

          <StudentLoginForm searchParams={searchParams} />

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href="/student-auth/request-access"
                className="font-semibold text-brand-brown hover:underline"
              >
                Request Access
              </Link>
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Are you a tutor?{" "}
            <Link href="/login" className="text-brand-brown hover:underline">
              Tutor login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
