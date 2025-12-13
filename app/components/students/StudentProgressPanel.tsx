"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  type LearningGoal,
  type LearningStats,
  createLearningGoal,
} from "@/lib/actions/progress";

type StudentProgressPanelProps = {
  studentId: string;
  studentName: string;
  stats: LearningStats | null;
  goals: LearningGoal[]; // Repurposed as "progress notes"
};

// Format minutes to readable time
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Format date to readable format
function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function StudentProgressPanel({
  studentId,
  studentName,
  stats,
  goals,
}: StudentProgressPanelProps) {
  const [noteText, setNoteText] = useState("");
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [notes, setNotes] = useState<LearningGoal[]>(goals);
  const [isSaving, startTransition] = useTransition();

  const totalLessons = stats?.total_lessons ?? 0;
  const totalMinutes = stats?.total_minutes ?? 0;
  const lastLessonAt = stats?.last_lesson_at;

  // Limit dots to prevent overwhelming UI
  const maxDots = 50;
  const displayDots = Math.min(totalLessons, maxDots);
  const remainingLessons = totalLessons - maxDots;

  const handleAddNote = (e: FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    startTransition(async () => {
      const result = await createLearningGoal({
        studentId,
        title: noteText.trim(),
        description: null,
        targetDate: null,
      });

      if ((result as any)?.data) {
        setNotes((prev) => [(result as any).data as LearningGoal, ...prev]);
        setNoteText("");
        setIsFormExpanded(false);
      }
    });
  };

  return (
    <div className="py-4">
      {/* Hero Metric */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-center py-6"
      >
        <span className="text-5xl sm:text-6xl font-light text-foreground tabular-nums">
          {totalLessons}
        </span>
        <p className="text-sm text-muted-foreground mt-1">
          {totalLessons === 1 ? "lesson completed" : "lessons completed"}
        </p>
      </motion.div>

      {/* Lesson Dots Visualization - only show when there are lessons */}
      {totalLessons > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 py-4 px-4">
          {Array.from({ length: displayDots }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: i * 0.04,
                duration: 0.25,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary"
            />
          ))}
          {remainingLessons > 0 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: maxDots * 0.04 + 0.1 }}
              className="text-xs text-muted-foreground self-center ml-1"
            >
              +{remainingLessons} more
            </motion.span>
          )}
        </div>
      )}

      {/* Metadata Subtext - only show when there are lessons */}
      {totalLessons > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-center text-xs text-muted-foreground mt-2"
        >
          {lastLessonAt ? `Last session: ${formatDate(lastLessonAt)}` : ""}
          {lastLessonAt && totalMinutes > 0 ? " · " : ""}
          {totalMinutes > 0 ? `${formatDuration(totalMinutes)} total` : ""}
        </motion.p>
      )}

      {/* Progress Notes Section - moved up with less spacing */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Progress notes
          </h3>
          {!isFormExpanded && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsFormExpanded(true)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add note
            </Button>
          )}
        </div>

        {/* Add Note Form */}
        <AnimatePresence>
          {isFormExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleAddNote} className="mb-4">
                <Textarea
                  placeholder={`Add a note about ${studentName}'s progress...`}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[70px] bg-background border-border/60 text-sm resize-none"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setIsFormExpanded(false);
                      setNoteText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={isSaving || !noteText.trim()}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes List */}
        {notes.length === 0 && !isFormExpanded ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            No notes yet
          </p>
        ) : (
          <div className="space-y-2.5">
            {notes.slice(0, 5).map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 text-sm"
              >
                <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                  {formatDate(note.created_at)}
                </span>
                <p className="text-foreground leading-relaxed">{note.title}</p>
              </motion.div>
            ))}
            {notes.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{notes.length - 5} more notes
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
