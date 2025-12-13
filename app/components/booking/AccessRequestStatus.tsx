"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, XCircle, Ban, Mail, ArrowLeft, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("accessStatus");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const statusConfig = {
    pending: {
      icon: Clock,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      title: t("pendingTitle"),
      message: t("pendingMessage", { tutorName: tutor.fullName }),
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    denied: {
      icon: XCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      title: t("deniedTitle"),
      message: t("deniedMessage", { tutorName: tutor.fullName }),
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    suspended: {
      icon: Ban,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      title: t("suspendedTitle"),
      message: t("suspendedMessage", { tutorName: tutor.fullName }),
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  };

  const config = statusConfig[accessStatus as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  const handleAction = (type: "resend" | "cancel") => {
    setActionMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/student/access-request/${type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tutorId: tutor.id }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok || body.error) {
          setActionMessage({ type: "error", text: body.error || "Action failed. Try again." });
          return;
        }
        setActionMessage({
          type: "success",
          text:
            type === "resend"
              ? "Request resent. We'll email the tutor."
              : "Request canceled. You can request again anytime.",
        });
      } catch {
        setActionMessage({ type: "error", text: "Unable to complete that action. Try again." });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-muted/40 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backHome")}
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
            <p className="text-xs text-muted-foreground mb-4">Typical response time: under 24 hours</p>

            {/* Status-Specific Information */}
            {accessStatus === "pending" && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t("whatNext")}</h3>
                <ul className="text-sm sm:text-base text-gray-600 space-y-2 text-left">
                  <li className="flex gap-2">
                    <span>1.</span>
                    <span>{t("step1", { tutorName: tutor.fullName })}</span>
                  </li>
                  <li className="flex gap-2">
                    <span>2.</span>
                    <span>{t("step2")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span>3.</span>
                    <span>{t("step3")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span>4.</span>
                    <span>{t("step4")}</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Contact Tutor */}
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                {accessStatus === "pending"
                  ? t("contactPromptPending")
                  : t("contactPromptOther")}
              </p>
              <a
                href={`mailto:${tutor.email}`}
                className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
              >
                <Mail className="h-4 w-4" />
                {t("contactTutor", { tutorName: tutor.fullName })}
              </a>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        {accessStatus === "pending" && (
          <div className="bg-white shadow-sm rounded-xl p-5 sm:p-6 text-center space-y-4">
            <p className="text-sm text-gray-600">
              {t("resendNote")}
            </p>
            {actionMessage ? (
              <div
                className={`mx-auto w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  actionMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {actionMessage.text}
              </div>
            ) : null}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => handleAction("resend")}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                Resend email
              </button>
              <button
                type="button"
                onClick={() => handleAction("cancel")}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel request
              </button>
            </div>
          </div>
        )}

        {accessStatus === "denied" && (
          <div className="bg-white shadow-sm rounded-xl p-5 sm:p-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              {t("deniedNote", { tutorName: tutor.fullName })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`mailto:${tutor.email}`}
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                <Mail className="h-4 w-4" />
                {t("emailTutor")}
              </a>
              {tutor.instagramHandle && (
                <a
                  href={`https://instagram.com/${tutor.instagramHandle.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary shadow-md px-6 py-3 rounded-lg font-semibold hover:bg-primary/5 transition"
                >
                  {t("contactInstagram")}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
