import Link from "next/link";
import Image from "next/image";
import { Clock, XCircle, Ban, Mail, ArrowLeft } from "lucide-react";
import { AccessStatus } from "@/lib/actions/student-auth";

interface TutorInfo {
  id: string;
  fullName: string;
  username: string;
  email: string;
  bio: string;
  avatarUrl: string;
  instagramHandle: string;
  websiteUrl: string;
}

interface AccessRequestStatusProps {
  tutor: TutorInfo;
  accessStatus: AccessStatus;
  studentId?: string;
}

export function AccessRequestStatus({
  tutor,
  accessStatus,
}: AccessRequestStatusProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      title: "Access Request Pending",
      message: `Your request to book lessons with ${tutor.fullName} is under review. You&apos;ll receive an email once approved.`,
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    denied: {
      icon: XCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      title: "Access Request Denied",
      message: `Unfortunately, ${tutor.fullName} is unable to accept your booking request at this time. Please contact them directly for more information.`,
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    suspended: {
      icon: Ban,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      title: "Access Temporarily Suspended",
      message: `Your calendar access has been temporarily suspended. Please contact ${tutor.fullName} to resolve this.`,
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  };

  const config = statusConfig[accessStatus as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-muted/40 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Tutor Header */}
        <div className="text-center mb-8">
          {tutor.avatarUrl && (
            <Image
              src={tutor.avatarUrl}
              alt={tutor.fullName}
              width={80}
              height={80}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
            />
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{tutor.fullName}</h1>
        </div>

        {/* Status Card */}
        <div
          className={`${config.bgColor} border-2 ${config.borderColor} rounded-2xl shadow-lg p-6 sm:p-8 mb-6`}
        >
          <div className="text-center">
            <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Icon className={`h-8 w-8 ${config.iconColor}`} />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              {config.title}
            </h2>

            <p className="text-gray-700 text-base sm:text-lg mb-6">{config.message}</p>

            {/* Status-Specific Information */}
            {accessStatus === "pending" && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
                <ul className="text-sm sm:text-base text-gray-600 space-y-2 text-left">
                  <li className="flex gap-2">
                    <span>1.</span>
                    <span>{tutor.fullName} will review your request</span>
                  </li>
                  <li className="flex gap-2">
                    <span>2.</span>
                    <span>You&apos;ll receive payment instructions via email</span>
                  </li>
                  <li className="flex gap-2">
                    <span>3.</span>
                    <span>Once approved, you can book lessons from the calendar</span>
                  </li>
                  <li className="flex gap-2">
                    <span>4.</span>
                    <span>You&apos;ll get email confirmations and reminders</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Contact Tutor */}
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                {accessStatus === "pending"
                  ? "Have questions while you wait?"
                  : "Need to discuss your access?"}
              </p>
              <a
                href={`mailto:${tutor.email}`}
                className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
              >
                <Mail className="h-4 w-4" />
                Contact {tutor.fullName}
              </a>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        {accessStatus === "pending" && (
          <div className="bg-white shadow-sm rounded-xl p-5 sm:p-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Didn&apos;t receive a confirmation email? Check your spam folder or request a new one.
            </p>
            <button
              className="text-sm font-semibold text-primary hover:underline"
              onClick={() => {
                // TODO: Implement resend email functionality
                alert("Email resent! Please check your inbox.");
              }}
            >
              Resend confirmation email
            </button>
          </div>
        )}

        {accessStatus === "denied" && (
          <div className="bg-white shadow-sm rounded-xl p-5 sm:p-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              If you believe this was a mistake, please reach out to {tutor.fullName} directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`mailto:${tutor.email}`}
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                <Mail className="h-4 w-4" />
                Email Tutor
              </a>
              {tutor.instagramHandle && (
                <a
                  href={`https://instagram.com/${tutor.instagramHandle.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary shadow-md px-6 py-3 rounded-lg font-semibold hover:bg-primary/5 transition"
                >
                  Contact on Instagram
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
