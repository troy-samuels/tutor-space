import { Metadata } from "next";
import Link from "next/link";
import { StudentSignupForm } from "@/components/student-auth/StudentSignupForm";

export const metadata: Metadata = {
  title: "Student Sign Up | TutorLingua",
  description: "Create a student account to find tutors and book lessons",
};

export default function StudentSignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-muted/40 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="mb-2 text-3xl font-bold text-primary">
              TutorLingua
            </h1>
          </Link>
          <p className="text-gray-600">Student Sign Up</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-lg">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            Create your account
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            Sign up to find tutors and start learning
          </p>

          <StudentSignupForm />
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Are you a tutor?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Create tutor account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
