import { Metadata } from "next";
import Link from "next/link";
import { StudentLoginForm } from "@/components/student-auth/StudentLoginForm";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-muted/40 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="mb-2 text-3xl font-bold text-primary">
              TutorLingua
            </h1>
          </Link>
          <p className="text-gray-600">Student Login</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            Welcome back
          </h2>

          <StudentLoginForm searchParams={searchParams} />

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href="/student-auth/signup"
                className="font-semibold text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Are you a tutor?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Tutor login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
