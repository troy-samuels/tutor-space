import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { hasStudioAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import { remark } from "remark";
import remarkHtml from "remark-html";
import sanitizeHtml from "sanitize-html";
import { ArrowLeft, CheckCircle2, ClipboardList, Gamepad2, PlayCircle, Sparkles } from "lucide-react";

type LessonRecording = {
  id: string;
  booking_id: string | null;
  status: string;
  storage_path: string | null;
  notes?: string | null;
  transcript_json?: unknown;
  ai_summary?: string | null;
  ai_summary_md?: string | null;
  key_points?: Array<{
    kind?: string;
    text?: string;
    timestamp_seconds?: number | null;
  }> | null;
  fluency_flags?: Array<{
    type?: string;
    text?: string;
    timestamp_seconds?: number | null;
  }> | null;
  tutor_id?: string | null;
};

type LessonDrill = {
  id: string;
  content: {
    type?: string;
    prompt?: string;
    original?: string;
    corrected?: string;
    word?: string;
    data?: unknown;
  };
  is_completed: boolean;
};

export default async function LessonReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(
      `
      id,
      tutor_id,
      students (
        user_id
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    notFound();
  }

  const studentsRelation = booking.students as unknown;
  const studentUserId = Array.isArray(studentsRelation)
    ? (studentsRelation[0] as { user_id?: string | null } | undefined)?.user_id ?? null
    : (studentsRelation as { user_id?: string | null } | null)?.user_id ?? null;

  const isTutorForBooking = booking.tutor_id === user.id;
  const isStudentForBooking = studentUserId === user.id;
  if (!isTutorForBooking && !isStudentForBooking) {
    notFound();
  }

  const { data: tutorProfile } = await supabase
    .from("profiles")
    .select("id, tier, plan")
    .eq("id", booking.tutor_id)
    .single();

  const tutorPlan = (tutorProfile?.plan as PlatformBillingPlan | null) ?? "professional";
  const tutorHasStudio = tutorProfile?.tier === "studio" || hasStudioAccess(tutorPlan);

  if (!tutorHasStudio) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
          <header className="space-y-2">
            <p className="text-xs text-slate-500">Lesson follow-up</p>
            <h1 className="text-2xl font-semibold">Lesson review unavailable</h1>
            <p className="text-sm text-slate-600">
              This Studio feature requires an active Studio plan.
            </p>
          </header>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            {isTutorForBooking ? (
              <>
                <p className="text-sm text-slate-700">
                  Upgrade to Studio to unlock recording replay, transcripts, and AI drills.
                </p>
                <Link
                  href="/settings/billing?upgrade=studio"
                  className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
                >
                  Upgrade to Studio
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-700">
                  Ask your tutor about upgrading to Studio for post-lesson recordings and practice missions.
                </p>
                <Link
                  href="/student"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Back to Student Portal
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { data: recording } = await supabase
    .from("lesson_recordings")
    .select(
      "id, booking_id, tutor_id, status, storage_path, notes, transcript_json, ai_summary, ai_summary_md, key_points, fluency_flags"
    )
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!recording) {
    notFound();
  }

  const { data: drills } = await supabase
    .from("lesson_drills")
    .select("id, content, is_completed")
    .eq("recording_id", recording.id)
    .order("created_at", { ascending: true });

  const practiceDrills: LessonDrill[] = (drills as LessonDrill[] | null) ?? [];

  const summaryMarkdown = extractSummary(recording);
  const summaryHtml = summaryMarkdown
    ? await remark()
        .use(remarkHtml)
        .process(summaryMarkdown)
        .then((file) =>
          sanitizeHtml(String(file), {
            allowedTags: [
              "p",
              "br",
              "strong",
              "em",
              "ul",
              "ol",
              "li",
              "a",
              "code",
              "pre",
              "blockquote",
            ],
            allowedAttributes: {
              a: ["href", "target", "rel"],
            },
          })
        )
    : null;

  const keyPoints = Array.isArray(recording.key_points) ? recording.key_points : [];
  const notes = typeof recording.notes === "string" ? recording.notes : "";
  const recordingUrl = await toSignedRecordingUrl(recording.storage_path);
  const isProcessing = ["processing", "transcribing", "analyzing", "uploading"].includes(recording.status ?? "");
  const isTutor = isTutorForBooking;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">Lesson follow-up</p>
            <h1 className="text-2xl font-semibold">Review and practise</h1>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium rounded-full px-3 py-2 border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Listen to Recording" icon={<PlayCircle className="h-5 w-5 text-slate-600" />} status={isTutor ? recording.status : undefined}>
            {isProcessing || !recordingUrl ? (
              <div className="h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 text-sm">
                Processing the recording…
              </div>
            ) : (
              <audio controls className="w-full" src={recordingUrl} />
            )}
          </Card>

          <Card title="AI summary" icon={<Sparkles className="h-5 w-5 text-slate-600" />}>
            <div className="space-y-3">
              {summaryHtml ? (
                <div
                  className="prose prose-sm max-w-none text-slate-800"
                  dangerouslySetInnerHTML={{ __html: summaryHtml }}
                />
              ) : (
                <p className="text-sm text-slate-500">Summary will appear here once the transcript finishes.</p>
              )}
              {keyPoints.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Key moments</p>
                  <ul className="space-y-1">
                    {keyPoints.map((kp, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span>
                          {kp.text}
                          {kp.timestamp_seconds != null && (
                            <span className="ml-2 text-xs text-slate-500">{formatTimestamp(kp.timestamp_seconds)}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Homework" icon={<ClipboardList className="h-5 w-5 text-slate-600" />}>
            <div className="space-y-2">
              <p className="text-sm text-slate-700">Your tutor will confirm homework here.</p>
              <div className="flex items-center justify-between gap-2">
                <Link
                  href="/student/progress"
                  className="inline-flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50"
                >
                  Open homework
                </Link>
                {isTutor && <StatusBadge status={recording.status} />}
              </div>
            </div>
          </Card>

          <Card title="Practice missions" icon={<Gamepad2 className="h-5 w-5 text-slate-600" />}>
            {practiceDrills.length === 0 ? (
              <p className="text-sm text-slate-500">Missions will appear once analysis finishes.</p>
            ) : (
              <div className="space-y-3">
                {practiceDrills.map((drill, index) => (
                  <DrillRow key={drill.id} drill={drill} index={index} />
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-medium text-slate-800">Shared notes</p>
          </div>
          <div className="mt-2 text-sm text-slate-700">
            {notes ? <pre className="whitespace-pre-wrap font-sans">{notes}</pre> : "No notes captured."}
          </div>
        </div>
      </div>
    </div>
  );
}

function DrillRow({ drill, index }: { drill: LessonDrill; index: number }) {
  const type = drill.content.type ?? "mission";
  const prompt =
    drill.content.prompt ||
    (drill.content.word ? `Practice: ${drill.content.word}` : null) ||
    (drill.content.original ? `Fix: ${drill.content.original}` : null) ||
    "Keep practicing this skill.";

  const correctedLine =
    drill.content.corrected && drill.content.original
      ? `"${drill.content.original}" → "${drill.content.corrected}"`
      : null;

  return (
    <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
      <div className="space-y-1">
        <p className="text-xs text-slate-500 uppercase">Mission {index + 1}</p>
        <p className="text-sm font-medium text-slate-800 capitalize">{type}</p>
        <p className="text-sm text-slate-700">{prompt}</p>
        {correctedLine && <p className="text-xs text-emerald-700">{correctedLine}</p>}
      </div>
      {drill.is_completed ? (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          Done
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
          <Sparkles className="h-4 w-4" />
          Pending
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "completed"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : status === "failed"
        ? "bg-red-100 text-red-700 border-red-200"
        : "bg-amber-100 text-amber-700 border-amber-200";
  const label =
    status === "completed"
      ? "Completed"
      : status === "failed"
        ? "Failed"
        : status === "processing"
          ? "Processing"
          : status === "transcribing"
            ? "Transcribing"
            : status === "analyzing"
              ? "Analyzing"
              : status === "uploading"
                ? "Uploading"
                : "Pending";
  const baseClasses = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border";
  return (
    <span className={`${baseClasses} ${color}`}>
      <Sparkles className="h-4 w-4" />
      {label}
    </span>
  );
}

function parseSupabaseStoragePath(
  value: string,
  fallbackBucket: string
): { bucket: string; objectPath: string | null; fallbackUrl: string | null } {
  try {
    const url = new URL(value);
    const pathname = url.pathname;
    const matchS3 = pathname.match(/\/storage\/v1\/s3\/([^/]+)\/(.+)$/);
    if (matchS3) {
      const bucket = matchS3[1]!;
      const objectPath = matchS3[2]!;
      const publicFallback = value.includes(".storage.supabase.co/storage/v1/s3/")
        ? value.replace(".storage.supabase.co/storage/v1/s3/", ".supabase.co/storage/v1/object/public/")
        : value;
      return { bucket, objectPath, fallbackUrl: publicFallback };
    }

    const matchPublic = pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (matchPublic) {
      return { bucket: matchPublic[1]!, objectPath: matchPublic[2]!, fallbackUrl: value };
    }
  } catch {
    // Not a URL.
  }

  if (!value.includes("://")) {
    return { bucket: fallbackBucket, objectPath: value.replace(/^\/+/, ""), fallbackUrl: null };
  }

  return { bucket: fallbackBucket, objectPath: null, fallbackUrl: value };
}

async function toSignedRecordingUrl(storagePath: string | null): Promise<string | null> {
  if (!storagePath) return null;

  const fallbackBucket = process.env.SUPABASE_S3_BUCKET || "recordings";
  const parsed = parseSupabaseStoragePath(storagePath, fallbackBucket);

  if (!parsed.objectPath) {
    return parsed.fallbackUrl;
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return parsed.fallbackUrl;
  }

  const { data, error } = await admin.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.objectPath, 60 * 60);

  if (error || !data?.signedUrl) {
    return parsed.fallbackUrl;
  }

  return data.signedUrl;
}

function extractSummary(recording: LessonRecording): string | null {
  const candidates = [
    recording.ai_summary_md,
    recording.ai_summary,
  ].filter((item): item is string => typeof item === "string" && item.trim().length > 0);

  if (candidates.length > 0) return candidates[0];

  const transcript = getTranscriptText(recording.transcript_json);
  return transcript ? `### Transcript\n\n${transcript}` : null;
}

function getTranscriptText(transcriptJson: unknown): string | null {
  if (!transcriptJson || typeof transcriptJson !== "object") return null;
  const json = transcriptJson as {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
        paragraphs?: {
          paragraphs?: Array<{
            sentences?: Array<{ text: string }>;
          }>;
        };
      }>;
    }>;
  };

  const channel = json.channels?.[0];
  const alternative = channel?.alternatives?.[0];
  const paragraphs = alternative?.paragraphs?.paragraphs;

  if (paragraphs && paragraphs.length > 0) {
    return paragraphs
      .map((p) => p.sentences?.map((s) => s.text).join(" ") ?? "")
      .join("\n\n");
  }

  return alternative?.transcript ?? null;
}

function formatTimestamp(seconds?: number | null) {
  if (seconds == null || Number.isNaN(seconds)) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function Card({
  title,
  icon,
  status,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  status?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-semibold text-slate-800">{title}</p>
        </div>
        {status && <StatusBadge status={status} />}
      </div>
      {children}
    </div>
  );
}
