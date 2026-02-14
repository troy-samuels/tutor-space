"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Link2, Send, Sparkles, X } from "lucide-react";

type AssignPracticeButtonProps = {
  studentId: string;
  studentName: string;
  defaultTopic?: string;
  grammarOptions?: string[];
  vocabularyOptions?: string[];
  defaultLanguage?: string;
  defaultLevel?: string;
  /** When true, shows as a post-lesson suggestion with pre-filled context. */
  postLesson?: boolean;
  /** Lesson language to pre-fill (used with postLesson). */
  lessonLanguage?: string;
  /** Lesson level to pre-fill (used with postLesson). */
  lessonLevel?: string;
};

/**
 * Normalizes focus chip options into unique, non-empty values.
 *
 * @param values - Raw option list.
 * @returns Sanitized option list.
 */
function normalizeOptions(values: string[] | undefined): string[] {
  if (!values || values.length === 0) {
    return [];
  }

  const unique = new Set<string>();
  for (const value of values) {
    const normalized = value.trim();
    if (normalized.length > 0) {
      unique.add(normalized);
    }
  }

  return [...unique];
}

/**
 * Splits and normalizes comma-separated user-entered focus values.
 *
 * @param value - Text field value.
 * @returns Sanitized focus list.
 */
function parseManualFocusList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * One-tap tutor modal for assigning contextual practice and generating a deep link.
 */
export function AssignPracticeButton({
  studentId,
  studentName,
  defaultTopic,
  grammarOptions,
  vocabularyOptions,
  defaultLanguage = "Spanish",
  defaultLevel = "Intermediate",
  postLesson = false,
  lessonLanguage,
  lessonLevel,
}: AssignPracticeButtonProps) {
  const resolvedLanguage = lessonLanguage || defaultLanguage;
  const resolvedLevel = lessonLevel || defaultLevel;
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState(
    defaultTopic || (postLesson ? `${resolvedLanguage} lesson follow-up practice` : "Lesson follow-up practice")
  );
  const [selectedGrammar, setSelectedGrammar] = useState<string[]>([]);
  const [selectedVocabulary, setSelectedVocabulary] = useState<string[]>([]);
  const [manualGrammar, setManualGrammar] = useState("");
  const [manualVocabulary, setManualVocabulary] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [messageToStudent, setMessageToStudent] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const grammarChoices = useMemo(() => normalizeOptions(grammarOptions), [grammarOptions]);
  const vocabularyChoices = useMemo(() => normalizeOptions(vocabularyOptions), [vocabularyOptions]);

  /**
   * Toggles a value in a selected options array.
   *
   * @param value - Option value.
   * @param current - Current selected array.
   * @param setter - State setter.
   */
  function toggleSelection(
    value: string,
    current: string[],
    setter: (next: string[]) => void
  ) {
    if (current.includes(value)) {
      setter(current.filter((item) => item !== value));
      return;
    }
    setter([...current, value]);
  }

  /**
   * Copies generated deep link to clipboard.
   */
  async function copyLink() {
    if (!generatedLink || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(generatedLink);
    setRequestSuccess("Deep link copied.");
  }

  /**
   * Submits one-tap assignment payload to the practice assignment API.
   *
   * @param event - Form submit event.
   */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);
    setRequestSuccess(null);
    setGeneratedLink(null);

    const normalizedTopic = topic.trim();
    if (normalizedTopic.length === 0) {
      setRequestError("Topic is required.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/practice/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          title: `Practice: ${normalizedTopic}`,
          topic: normalizedTopic,
          language: resolvedLanguage,
          level: resolvedLevel,
          grammarFocus: [...selectedGrammar, ...parseManualFocusList(manualGrammar)],
          vocabularyFocus: [...selectedVocabulary, ...parseManualFocusList(manualVocabulary)],
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          messageToStudent: messageToStudent.trim() || null,
          instructions: messageToStudent.trim() || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string; deepLink?: string }
        | null;

      if (!response.ok) {
        setRequestError(payload?.message || payload?.error || "Failed to assign practice.");
        return;
      }

      setGeneratedLink(payload?.deepLink || null);
      setRequestSuccess(`Practice assigned to ${studentName}.`);
    });
  }

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className={
          postLesson
            ? "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-white shadow-[0_4px_24px_-4px_rgba(232,120,77,0.6)]"
            : "inline-flex h-11 items-center gap-2 rounded-full border border-primary/50 bg-primary/20 px-5 text-sm font-semibold text-foreground shadow-[0_0_24px_-10px_rgba(232,120,77,0.6)] backdrop-blur-xl"
        }
      >
        <Sparkles className={postLesson ? "h-4 w-4" : "h-4 w-4 text-primary"} />
        {postLesson ? `Assign ${resolvedLanguage} practice` : "Assign Practice"}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="w-full max-w-xl rounded-3xl border border-white/[0.1] bg-background p-5 text-foreground shadow-[0_0_70px_-30px_rgba(232,120,77,0.55)] backdrop-blur-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Assign Practice</h2>
                  <p className="text-sm text-muted-foreground">One tap to send {studentName} a deep link.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Topic</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    className="w-full rounded-2xl border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-sm text-foreground outline-none focus:border-primary/70"
                    placeholder="Past tense storytelling"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Grammar focus</label>
                    <div className="flex flex-wrap gap-2">
                      {grammarChoices.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleSelection(item, selectedGrammar, setSelectedGrammar)}
                          className={`rounded-full border px-3 py-1.5 text-xs ${
                            selectedGrammar.includes(item)
                              ? "border-primary/70 bg-primary/20 text-foreground"
                              : "border-white/[0.12] bg-white/[0.03] text-muted-foreground"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={manualGrammar}
                      onChange={(event) => setManualGrammar(event.target.value)}
                      className="w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-xs text-foreground outline-none focus:border-primary/70"
                      placeholder="Extra grammar (comma separated)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Vocabulary focus</label>
                    <div className="flex flex-wrap gap-2">
                      {vocabularyChoices.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleSelection(item, selectedVocabulary, setSelectedVocabulary)}
                          className={`rounded-full border px-3 py-1.5 text-xs ${
                            selectedVocabulary.includes(item)
                              ? "border-primary/70 bg-primary/20 text-foreground"
                              : "border-white/[0.12] bg-white/[0.03] text-muted-foreground"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={manualVocabulary}
                      onChange={(event) => setManualVocabulary(event.target.value)}
                      className="w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-xs text-foreground outline-none focus:border-primary/70"
                      placeholder="Extra vocabulary (comma separated)"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Due date (optional)</label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                        className="w-full rounded-2xl border border-white/[0.12] bg-white/[0.05] py-3 pl-10 pr-3 text-sm outline-none focus:border-primary/70"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Message (optional)</label>
                    <input
                      type="text"
                      value={messageToStudent}
                      onChange={(event) => setMessageToStudent(event.target.value)}
                      className="w-full rounded-2xl border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-sm outline-none focus:border-primary/70"
                      placeholder="Focus on sentence transitions."
                    />
                  </div>
                </div>

                {requestError ? (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{requestError}</p>
                ) : null}
                {requestSuccess ? (
                  <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                    {requestSuccess}
                  </p>
                ) : null}

                {generatedLink ? (
                  <div className="rounded-xl border border-white/[0.12] bg-white/[0.04] p-3">
                    <p className="mb-2 text-xs uppercase tracking-[0.08em] text-muted-foreground">Deep link</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedLink}
                        readOnly
                        className="h-10 flex-1 rounded-xl border border-white/[0.12] bg-background px-3 text-xs text-muted-foreground"
                      />
                      <button
                        type="button"
                        onClick={copyLink}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-primary/50 bg-primary/20 px-3 text-xs font-semibold text-foreground"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-11 items-center rounded-full border border-white/[0.12] bg-white/[0.04] px-4 text-sm text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-primary/60 bg-primary/20 px-5 text-sm font-semibold text-foreground disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Assigning..." : "Assign Practice"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
