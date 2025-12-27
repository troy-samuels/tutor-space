import { validateInviteToken } from "@/lib/actions/invite-links";
import { InviteSignupForm } from "@/components/invite/InviteSignupForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface JoinPageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;

  // Check if user is already logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Validate the invite token
  const result = await validateInviteToken(token);

  // If invalid token, show error
  if (!result.valid || !result.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Invite Link
            </h1>
            <p className="text-gray-600 mb-6">
              {result.error || "This invite link is invalid, expired, or has been deactivated."}
            </p>
            <div className="space-y-3">
              <Link
                href="/student/signup"
                className="block w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Sign up normally
              </Link>
              <Link
                href="/student/login"
                className="block w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Log in to existing account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { tutorUsername, tutorFullName, tutorAvatarUrl, serviceIds } = result.data;

  // If already logged in, redirect to booking page
  if (user) {
    const bookUrl = serviceIds.length > 0
      ? `/book/${tutorUsername}?services=${serviceIds.join(',')}`
      : `/book/${tutorUsername}`;
    redirect(bookUrl);
  }

  // Fetch services if scoped
  let services: Array<{ id: string; name: string }> = [];
  if (serviceIds.length > 0) {
    const { data: serviceData } = await supabase
      .from("services")
      .select("id, name")
      .in("id", serviceIds);
    services = serviceData ?? [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Tutor Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-center">
              {/* Avatar */}
              {tutorAvatarUrl ? (
                <Image
                  src={tutorAvatarUrl}
                  alt={tutorFullName || tutorUsername}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white shadow-lg bg-white flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">
                    {(tutorFullName || tutorUsername).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <h1 className="text-white text-xl font-semibold mb-1">
                You&apos;ve been invited!
              </h1>
              <p className="text-indigo-100">
                {tutorFullName || tutorUsername} invited you to join
              </p>
            </div>

            {/* Service Scope Banner */}
            {services.length > 0 && (
              <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-3">
                <p className="text-sm text-indigo-700">
                  <span className="font-medium">Available services:</span>{" "}
                  {services.map(s => s.name).join(", ")}
                </p>
              </div>
            )}

            {/* Form */}
            <div className="p-6">
              <InviteSignupForm
                inviteToken={token}
                tutorUsername={tutorUsername}
                tutorFullName={tutorFullName}
                serviceIds={serviceIds}
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href={`/student/login?redirect=/book/${tutorUsername}`}
                  className="text-indigo-600 font-medium hover:text-indigo-700"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: JoinPageProps) {
  const { token } = await params;
  const result = await validateInviteToken(token);

  if (!result.valid || !result.data) {
    return {
      title: "Invalid Invite - TutorLingua",
      description: "This invite link is invalid or expired.",
    };
  }

  const tutorName = result.data.tutorFullName || result.data.tutorUsername;

  return {
    title: `Join ${tutorName} - TutorLingua`,
    description: `You've been invited to join ${tutorName} on TutorLingua. Create your account to book lessons.`,
  };
}
