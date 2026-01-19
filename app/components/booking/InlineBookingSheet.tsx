"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, LogIn, ShieldAlert, CalendarClock, RefreshCw } from "lucide-react";
import BookingInterface from "./BookingInterface";
import type { BookableSlot } from "@/lib/utils/slots";
import type { AccessStatus, StudentLessonHistoryData } from "@/lib/actions/types";
import { FormStatusAlert } from "@/components/forms/form-status-alert";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: number;
  price_currency: string;
  is_active: boolean;
};

type Tutor = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  bio: string;
  avatarUrl: string;
  instagramHandle: string;
  websiteUrl: string;
  timezone: string;
};

type GroupedSlots = {
  date: string;
  dateFormatted: string;
  slots: BookableSlot[];
};

type InlineBookingResponse =
  | {
      status: "ok";
      tutor: Tutor;
      services: Service[];
      selectedServiceId: string;
      groupedSlots: GroupedSlots[];
      lessonHistory: StudentLessonHistoryData | null;
      timezone: string;
    }
  | {
      status: "login_required";
      tutor: Tutor;
      services: Service[];
    }
  | {
      status: "access_required";
      tutor: Tutor;
      services: Service[];
      accessStatus: AccessStatus;
      studentId?: string;
    }
  | { status: "no_services" }
  | { status: "not_found" }
  | { status: "error" };

type InlineBookingSheetProps = {
  open: boolean;
  onClose: () => void;
  username: string;
  fallbackUrl: string;
};

const SHEET_VARIANTS = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
};

export function InlineBookingSheet({ open, onClose, username, fallbackUrl }: InlineBookingSheetProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InlineBookingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    let isActive = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/booking/inline/${username}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const body = (await res.json()) as InlineBookingResponse;
        if (isActive) {
          setData(body);
        }
      } catch (err) {
        console.error("Inline booking fetch error", err);
        if (isActive) {
          setError("Something went wrong loading availability.");
          setData({ status: "error" });
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isActive = false;
    };
  }, [open, username, reloadKey]);

  const parsedSlots = useMemo(() => {
    if (!data || data.status !== "ok") return null;
    return data.groupedSlots.map((group) => ({
      ...group,
      slots: group.slots.map((slot) => ({
        ...slot,
        start: new Date(slot.start),
        end: new Date(slot.end),
      })),
    }));
  }, [data]);

  const renderGateCard = (title: string, message: string, actions: React.ReactNode) => (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-slate-800">
        <ShieldAlert className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <p className="text-base font-semibold">{title}</p>
          <p className="text-sm text-slate-600">{message}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">{actions}</div>
    </div>
  );

  const renderBody = () => {
    if (loading || !data) {
      return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading availability…</p>
        </div>
      );
    }

    if (error || data.status === "error") {
      const message = error || "Unable to load booking right now.";
      return (
        <div className="space-y-4">
          <FormStatusAlert
            message={message}
            tone="error"
            ariaLive="assertive"
            className="rounded-lg border border-destructive/20 bg-destructive/10 text-left"
          />
          <button
            type="button"
            onClick={() => setReloadKey((prev) => prev + 1)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <a
            href={fallbackUrl}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <CalendarClock className="h-4 w-4" />
            Open full booking page
          </a>
        </div>
      );
    }

    if (data.status === "not_found" || data.status === "no_services") {
      return (
        <div className="space-y-3 text-center">
          <p className="text-sm text-slate-700">
            {data.status === "not_found"
              ? "This tutor could not be found."
              : "This tutor has not published services yet."}
          </p>
          <a
            href={fallbackUrl}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            <CalendarClock className="h-4 w-4" />
            View full booking page
          </a>
        </div>
      );
    }

    if (data.status === "login_required") {
      const loginUrl = `/student/login?tutor=${data.tutor.username}&redirect=/book/${data.tutor.username}`;
      const requestUrl = `/student/request-access?tutor=${data.tutor.username}&tutor_id=${data.tutor.id}`;
      return renderGateCard(
        "Log in to book",
        "Sign in to see real-time availability and book instantly.",
        <>
          <a
            href={loginUrl}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <LogIn className="h-4 w-4" />
            Log in
          </a>
          <a
            href={requestUrl}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            Request access
          </a>
        </>
      );
    }

    if (data.status === "access_required") {
      const requestUrl = `/student/request-access?tutor=${data.tutor.username}&tutor_id=${data.tutor.id}`;
      return renderGateCard(
        "Access required",
        data.accessStatus === "pending"
          ? "Your request is pending. We’ll email you as soon as the tutor approves."
          : "Request access to view the tutor’s calendar.",
        <>
          {data.accessStatus !== "pending" ? (
            <a
              href={requestUrl}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Request access
            </a>
          ) : null}
          <a
            href={fallbackUrl}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            <CalendarClock className="h-4 w-4" />
            View details
          </a>
        </>
      );
    }

    if (data.status === "ok" && parsedSlots) {
      const selectedService =
        data.services.find((svc) => svc.id === data.selectedServiceId) || data.services[0];

      return (
        <BookingInterface
          variant="inline"
          tutor={data.tutor}
          services={data.services}
          selectedService={selectedService}
          groupedSlots={parsedSlots}
          lessonHistory={data.lessonHistory}
        />
      );
    }

    return null;
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-3 pb-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            variants={SHEET_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <CalendarClock className="h-4 w-4 text-primary" />
                Book a lesson
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!loading) {
                      setData(null);
                      onClose();
                    }
                  }}
                  className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close booking"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[80vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              {renderBody()}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500 sm:text-left">
              Prefer the full page?{" "}
              <a
                className="font-semibold text-primary hover:underline"
                href={fallbackUrl}
              >
                Open booking page
              </a>
              <button
                className="ml-3 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                onClick={() => {
                  setData(null);
                  setError(null);
                  setReloadKey((key) => key + 1);
                }}
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
