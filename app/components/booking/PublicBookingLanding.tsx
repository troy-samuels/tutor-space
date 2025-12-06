import Link from "next/link";
import Image from "next/image";
import { LogIn, UserPlus, Mail, Globe, Instagram } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";

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

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: number;
  price_currency: string;
}

interface PublicBookingLandingProps {
  tutor: TutorInfo;
  services: Service[];
  isLoggedIn?: boolean;
}

export function PublicBookingLanding({
  tutor,
  services,
  isLoggedIn = false,
}: PublicBookingLandingProps) {
  const t = useTranslations("publicBooking");

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-muted/40 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          {tutor.avatarUrl && (
            <Image
              src={tutor.avatarUrl}
              alt={tutor.fullName}
              width={96}
              height={96}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
            />
          )}
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
            {tutor.fullName}
          </h1>
          {tutor.bio && (
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">{tutor.bio}</p>
          )}

          {/* Social Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6">
            {tutor.instagramHandle && (
              <a
                href={`https://instagram.com/${tutor.instagramHandle.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-primary transition"
              >
                <Instagram className="h-5 w-5" />
                <span className="text-sm hidden sm:inline">{tutor.instagramHandle}</span>
                <span className="text-sm sm:hidden">Instagram</span>
              </a>
            )}
            {tutor.websiteUrl && (
              <a
                href={tutor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-primary transition"
              >
                <Globe className="h-5 w-5" />
                <span className="text-sm">Website</span>
              </a>
            )}
          </div>
        </div>

        {/* Access Gate Message */}
        <div className="bg-white rounded-2xl shadow-md shadow-lg p-8 mb-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLoggedIn ? t("requestAccess") : t("signInToBook")}
            </h2>

            <p className="text-gray-600 mb-6">
              {isLoggedIn
                ? t("requestMessageLoggedIn", { tutorName: tutor.fullName })
                : t("requestMessageLoggedOut", { tutorName: tutor.fullName })}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isLoggedIn ? (
                <>
                  <Link
                    href={`/student-auth/login?tutor=${tutor.username}&redirect=/book/${tutor.username}`}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition shadow-md"
                  >
                    <LogIn className="h-5 w-5" />
                    {t("login")}
                  </Link>
                  <Link
                    href={`/student-auth/request-access?tutor=${tutor.username}&tutor_id=${tutor.id}`}
                    className="inline-flex items-center justify-center gap-2 bg-white text-primary shadow-md px-8 py-4 rounded-xl font-semibold hover:bg-primary/5 transition"
                  >
                    <UserPlus className="h-5 w-5" />
                    {t("request")}
                  </Link>
                </>
              ) : (
                <Link
                  href={`/student-auth/request-access?tutor=${tutor.username}&tutor_id=${tutor.id}`}
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition shadow-md"
                >
                  <UserPlus className="h-5 w-5" />
                  {t("requestCalendar")}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Services Preview */}
        <div className="bg-white rounded-2xl shadow-sm shadow-sm p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {t("availableServices")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.id}
                className="shadow-sm rounded-xl p-4 sm:p-6 hover:shadow-lg transition"
              >
                <h4 className="font-semibold text-gray-900 mb-2">{service.name}</h4>
                {service.description && (
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {t("minutes", { minutes: service.duration_minutes })}
                  </span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(service.price_amount, service.price_currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Alternative */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <p className="text-sm text-gray-600 mb-4">
            {t("contactPrompt", { tutorName: tutor.fullName })}
          </p>
          <a
            href={`mailto:${tutor.email}`}
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            <Mail className="h-4 w-4" />
            {tutor.email}
          </a>
        </div>
      </div>
    </div>
  );
}
