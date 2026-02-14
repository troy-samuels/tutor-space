"use client";

import { useState, useTransition, useMemo, useRef, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Circle,
  CheckCircle2,
  Plus,
  X,
  Link2,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Mic,
  FileText,
  Paperclip,
  MessageSquare,
  Play,
  Pause,
  Download,
  Loader2,
  Sparkles,
  StickyNote,
  Send,
  Lightbulb,
} from "lucide-react";
import { HomeworkDraftReviewPanel } from "./HomeworkDraftReviewPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type HomeworkAssignment,
  type HomeworkAttachment,
  assignHomework,
  updateHomeworkStatus,
} from "@/lib/actions/progress";
import {
  type HomeworkSubmission,
  getHomeworkSubmissions,
  reviewSubmission,
  uploadHomeworkInstructionAudio,
} from "@/lib/actions/homework-submissions";
import { AudioRecorder } from "@/components/student/AudioRecorder";
import {
  format,
  isThisWeek,
  isPast,
  parseISO,
  formatDistanceToNow,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from "date-fns";

type PracticeScenario = {
  id: string;
  title: string;
  language: string;
  level: string | null;
  topic: string | null;
};

type DrillPreview = {
  id: string;
  content: Record<string, unknown>;
  drill_type: string;
  focus_area: string | null;
  source: string;
  visible_to_student: boolean;
  tutor_approved: boolean;
};

type HomeworkDraft = {
  id: string;
  title: string;
  instructions: string;
  status: string;
  source: string;
  recording_id: string | null;
  due_date: string | null;
  tutor_reviewed: boolean;
  created_at: string;
  drills: DrillPreview[];
  aiSummary?: string | null;
};

type HomeworkTabProps = {
  studentId: string;
  studentName: string;
  assignments: HomeworkAssignment[];
  drafts?: HomeworkDraft[];
  nextClassDate?: string | null;
  nextBookingId?: string | null;
  scenarios?: PracticeScenario[];
  isStudentSubscribed?: boolean;
  onDraftUpdate?: () => void;
};

type ResourceInput = {
  label: string;
  url: string;
};

export function HomeworkTab({ studentId, studentName, assignments, drafts = [], nextClassDate, nextBookingId, scenarios, isStudentSubscribed, onDraftUpdate }: HomeworkTabProps) {
  const [items, setItems] = useState<HomeworkAssignment[]>(assignments);
  const [draftItems, setDraftItems] = useState<HomeworkDraft[]>(drafts);
  const [isPending, startTransition] = useTransition();

  // Format next class date for the date input (YYYY-MM-DD)
  const defaultDueDate = nextClassDate
    ? format(parseISO(nextClassDate), "yyyy-MM-dd")
    : "";

  // Form state
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [resources, setResources] = useState<ResourceInput[]>([]);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [resourceLabel, setResourceLabel] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  // AI Practice state
  const [enableAIPractice, setEnableAIPractice] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  // Minimal composer state
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [privateNotes, setPrivateNotes] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calendar picker state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDueDate, setSelectedDueDate] = useState<Date | null>(
    dueDate ? new Date(dueDate) : null
  );

  // Track if due date is linked to booking (for auto-sync on reschedule)
  const [dueDateLinkedToBooking, setDueDateLinkedToBooking] = useState(!!nextBookingId);

  // Submission review state
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, HomeworkSubmission[]>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<Record<string, string>>({});
  const [isReviewing, setIsReviewing] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Count assignments due this week
  const thisWeekCount = useMemo(() => {
    return items.filter((item) => {
      if (item.status === "completed" || item.status === "cancelled") return false;
      if (!item.due_date) return true; // No due date counts as current
      return isThisWeek(parseISO(item.due_date), { weekStartsOn: 1 });
    }).length;
  }, [items]);

  // Sync selectedDueDate with dueDate
  useEffect(() => {
    if (dueDate) {
      setSelectedDueDate(new Date(dueDate));
    } else {
      setSelectedDueDate(null);
    }
  }, [dueDate]);

  // Sync drafts from props
  useEffect(() => {
    setDraftItems(drafts);
  }, [drafts]);

  const toggleComplete = (assignmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "assigned" : "completed";

    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === assignmentId ? { ...item, status: newStatus as any } : item
      )
    );

    startTransition(async () => {
      const result = await updateHomeworkStatus({ assignmentId, status: newStatus as any });
      if ((result as any)?.error) {
        // Revert on error
        setItems((prev) =>
          prev.map((item) =>
            item.id === assignmentId ? { ...item, status: currentStatus as any } : item
          )
        );
      }
    });
  };

  const handleAddResource = () => {
    if (!resourceUrl.trim()) {
      setIsAddingResource(false);
      return;
    }

    setResources((prev) => [
      ...prev,
      { label: resourceLabel.trim() || resourceUrl.trim(), url: resourceUrl.trim() },
    ]);
    setResourceLabel("");
    setResourceUrl("");
    setIsAddingResource(false);
  };

  const handleRemoveResource = (index: number) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResourceKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddResource();
    } else if (e.key === "Escape") {
      setResourceLabel("");
      setResourceUrl("");
      setIsAddingResource(false);
    }
  };

  const handleAssign = () => {
    if (!title.trim()) return;

    startTransition(async () => {
      const attachments: HomeworkAttachment[] = resources.map((r) => ({
        label: r.label,
        url: r.url,
        type: "link" as const,
      }));

      // Upload audio instruction if present
      let audioInstructionUrl: string | null = null;
      if (audioBlob) {
        const formData = new FormData();
        formData.append("file", audioBlob, `instruction.${audioBlob.type === "audio/webm" ? "webm" : "mp4"}`);
        const uploadResult = await uploadHomeworkInstructionAudio(formData);
        if (uploadResult.error) {
          console.error("Failed to upload audio:", uploadResult.error);
          // Continue without audio rather than failing the whole assignment
        } else {
          audioInstructionUrl = uploadResult.url;
        }
      }

      // 1. Create homework (link to booking if using default due date)
      const result = await assignHomework({
        studentId,
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        bookingId: dueDateLinkedToBooking ? nextBookingId : null,
        attachments,
        audioInstructionUrl,
      });

      if ((result as any)?.error) {
        console.error("Failed to create homework:", result);
        return;
      }

      const homeworkData = (result as any).data as HomeworkAssignment;

      // 2. If AI Practice enabled, create linked practice assignment
      if (enableAIPractice && selectedScenarioId && homeworkData) {
        try {
          await fetch("/api/practice/assign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId,
              title: `Practice: ${title.trim()}`,
              instructions: null,
              scenarioId: selectedScenarioId,
              dueDate: dueDate ? new Date(dueDate).toISOString() : null,
              homeworkAssignmentId: homeworkData.id,
            }),
          });
        } catch (err) {
          console.error("Practice assignment error:", err);
          // Don't block homework creation if practice fails
        }
      }

      // 3. Update UI & reset form
      if (homeworkData) {
        setItems((prev) => [homeworkData, ...prev]);
      }
      setTitle("");
      setDueDate(defaultDueDate);
      setDueDateLinkedToBooking(!!nextBookingId);
      setResources([]);
      setEnableAIPractice(false);
      setSelectedScenarioId(null);
      setShowAudioRecorder(false);
      setShowNotesPanel(false);
      setPrivateNotes("");
      setAudioBlob(null);
      setAudioDuration(0);
      setUploadedFiles([]);
    });
  };

  // Fetch submissions when expanding an assignment
  const handleToggleExpand = async (assignmentId: string) => {
    if (expandedItemId === assignmentId) {
      setExpandedItemId(null);
      return;
    }

    setExpandedItemId(assignmentId);

    // Only fetch if we don't already have submissions for this assignment
    if (!submissions[assignmentId]) {
      setLoadingSubmissions(assignmentId);
      const result = await getHomeworkSubmissions(assignmentId);
      if (result.data) {
        setSubmissions((prev) => ({ ...prev, [assignmentId]: result.data }));
        // Pre-fill feedback fields with existing feedback
        result.data.forEach((sub) => {
          if (sub.tutor_feedback) {
            setReviewFeedback((prev) => ({ ...prev, [sub.id]: sub.tutor_feedback || "" }));
          }
        });
      }
      setLoadingSubmissions(null);
    }
  };

  // Handle tutor review submission
  const handleReview = async (submissionId: string, status: "reviewed" | "needs_revision") => {
    const feedback = reviewFeedback[submissionId] || "";
    if (!feedback.trim()) return;

    setIsReviewing(true);
    const result = await reviewSubmission({
      submissionId,
      feedback: feedback.trim(),
      status,
    });

    if (!result.error) {
      // Update local state
      setSubmissions((prev) => {
        const updated = { ...prev };
        for (const key in updated) {
          updated[key] = updated[key].map((sub) =>
            sub.id === submissionId
              ? { ...sub, tutor_feedback: feedback.trim(), review_status: status, reviewed_at: new Date().toISOString() }
              : sub
          );
        }
        return updated;
      });

      // If marked as reviewed, update homework status to completed
      if (status === "reviewed") {
        const homeworkId = Object.keys(submissions).find((key) =>
          submissions[key].some((s) => s.id === submissionId)
        );
        if (homeworkId) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === homeworkId ? { ...item, status: "completed" as const, completed_at: new Date().toISOString() } : item
            )
          );
        }
      }
    }
    setIsReviewing(false);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDueDate = (date: string | null) => {
    if (!date) return null;
    const parsed = parseISO(date);
    if (isPast(parsed)) return "Overdue";
    return `Due ${format(parsed, "MMM d")}`;
  };

  // File handling for minimal composer
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.size <= 50 * 1024 * 1024); // 50MB max
    setUploadedFiles(prev => [...prev, ...validFiles]);
    e.target.value = ''; // Reset input
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Group: active (pending, assigned, in_progress, submitted) vs completed
  const activeItems = items.filter(
    (item) => item.status !== "completed" && item.status !== "cancelled"
  );
  const completedItems = items.filter((item) => item.status === "completed");

  return (
    <div className="py-4">
      {/* Header with count */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Homework</h3>
          <p className="text-xs text-muted-foreground">
            {thisWeekCount} assignment{thisWeekCount !== 1 ? "s" : ""} this week
          </p>
        </div>
      </div>

      {/* AI-Generated Drafts Section */}
      {draftItems.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <h4 className="text-sm font-medium text-amber-900">
              AI-Generated ({draftItems.length} pending review)
            </h4>
          </div>
          <div className="space-y-3">
            {draftItems.map((draft) => (
              <HomeworkDraftReviewPanel
                key={draft.id}
                homework={{
                  id: draft.id,
                  title: draft.title,
                  instructions: draft.instructions,
                  status: draft.status,
                  source: draft.source,
                  recording_id: draft.recording_id,
                  due_date: draft.due_date,
                  tutor_reviewed: draft.tutor_reviewed,
                  created_at: draft.created_at,
                }}
                drills={draft.drills}
                aiSummary={draft.aiSummary}
                studentName={studentName}
                onUpdate={() => {
                  // Remove the draft from local state after update
                  setDraftItems((prev) => prev.filter((d) => d.id !== draft.id));
                  onDraftUpdate?.();
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Minimal Homework Composer */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm mb-4">
            {/* Row 1: Input + Toolbar */}
            <div className="flex items-end gap-2 p-3">
              {/* Main textarea */}
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`What should ${studentName} work on?`}
                rows={1}
                data-testid="homework-composer-input"
                className="flex-1 resize-none border-0 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none min-h-[36px]"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                }}
              />

              {/* Icon Toolbar */}
              <div className="flex items-center gap-1 shrink-0">
                {/* AI Practice */}
                {scenarios && scenarios.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setEnableAIPractice(!enableAIPractice)}
                    disabled={!isStudentSubscribed}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                      enableAIPractice
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                    title={isStudentSubscribed ? "AI Practice" : "Student not subscribed to AI Practice"}
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                )}

                {/* Audio */}
                <button
                  type="button"
                  onClick={() => setShowAudioRecorder(!showAudioRecorder)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                    showAudioRecorder || audioBlob
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title="Audio instruction"
                >
                  <Mic className="h-4 w-4" />
                </button>

                {/* Attachments */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                    uploadedFiles.length > 0 || resources.length > 0
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title="Attach files or links"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                {/* Notes */}
                <button
                  type="button"
                  onClick={() => setShowNotesPanel(!showNotesPanel)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                    showNotesPanel || privateNotes
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title="Private notes"
                >
                  <StickyNote className="h-4 w-4" />
                </button>

                {/* Divider */}
                <div className="h-5 w-px bg-border mx-1" />

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={!title.trim() || isPending}
                  data-testid="homework-assign-button"
                  className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Row 2: Expandable Options */}
            <AnimatePresence>
              {(enableAIPractice || showAudioRecorder || showNotesPanel ||
                uploadedFiles.length > 0 || resources.length > 0 || audioBlob || isAddingResource) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-0 space-y-3 border-t border-border/30">
                    {/* Due Date - Popover Calendar */}
                    <div className="flex items-center gap-2 pt-3">
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`h-8 px-3 rounded-lg flex items-center gap-2 text-xs transition-colors ${
                              selectedDueDate
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <Calendar className="h-4 w-4" />
                            {selectedDueDate ? format(selectedDueDate, "MMM d") : "Due date"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          {/* Mini Calendar Grid */}
                          <div className="space-y-3">
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                                className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-medium">
                                {format(calendarMonth, "MMMM yyyy")}
                              </span>
                              <button
                                type="button"
                                onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                                className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Day Headers */}
                            <div className="grid grid-cols-7 gap-1 text-center">
                              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                                <div key={i} className="text-[10px] text-muted-foreground font-medium py-1">
                                  {day}
                                </div>
                              ))}
                            </div>

                            {/* Days Grid */}
                            <div className="grid grid-cols-7 gap-1">
                              {eachDayOfInterval({
                                start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 }),
                                end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 }),
                              }).map((day) => {
                                const isSelected = selectedDueDate && isSameDay(day, selectedDueDate);
                                const isTodayDate = isToday(day);
                                const isCurrentMonth = isSameMonth(day, calendarMonth);

                                return (
                                  <button
                                    key={day.toISOString()}
                                    type="button"
                                    onClick={() => {
                                      const formattedDay = format(day, "yyyy-MM-dd");
                                      setSelectedDueDate(day);
                                      setDueDate(formattedDay);
                                      // Keep linked to booking only if selecting the default (next lesson) date
                                      setDueDateLinkedToBooking(formattedDay === defaultDueDate && !!nextBookingId);
                                      setCalendarOpen(false);
                                    }}
                                    className={`
                                      h-8 w-8 rounded-md text-xs flex items-center justify-center transition-colors
                                      ${!isCurrentMonth ? "text-muted-foreground/40" : ""}
                                      ${isSelected ? "bg-primary text-primary-foreground" : ""}
                                      ${isTodayDate && !isSelected ? "border border-primary" : ""}
                                      ${isCurrentMonth && !isSelected ? "hover:bg-muted" : ""}
                                    `}
                                  >
                                    {format(day, "d")}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 pt-2 border-t border-border/50">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDueDate(null);
                                  setDueDate("");
                                  setDueDateLinkedToBooking(false);
                                  setCalendarOpen(false);
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Clear
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const today = new Date();
                                  const todayFormatted = format(today, "yyyy-MM-dd");
                                  setSelectedDueDate(today);
                                  setDueDate(todayFormatted);
                                  setDueDateLinkedToBooking(todayFormatted === defaultDueDate && !!nextBookingId);
                                  setCalendarMonth(today);
                                }}
                                className="text-xs text-primary hover:text-primary/80"
                              >
                                Today
                              </button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {selectedDueDate && dueDate === defaultDueDate && nextClassDate && (
                        <span className="text-xs text-primary">Next class</span>
                      )}
                    </div>

                    {/* AI Practice Scenario */}
                    {enableAIPractice && scenarios && scenarios.length > 0 && (
                      <Select value={selectedScenarioId || ""} onValueChange={setSelectedScenarioId}>
                        <SelectTrigger className="h-8 text-xs">
                          <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                          <SelectValue placeholder="Choose practice scenario" />
                        </SelectTrigger>
                        <SelectContent>
                          {scenarios.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="text-xs">
                              {s.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Audio Recorder */}
                    {showAudioRecorder && (
                      <div className="rounded-lg border border-border/50 p-3 bg-muted/30">
                        {audioBlob ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-1">
                              <Mic className="h-4 w-4 text-primary" />
                              <span>Audio instruction recorded ({Math.floor(audioDuration / 60)}:{(audioDuration % 60).toString().padStart(2, "0")})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAudioBlob(null);
                                setAudioDuration(0);
                              }}
                              className="text-xs text-muted-foreground hover:text-destructive"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <AudioRecorder
                            maxDurationSeconds={120}
                            onRecordingComplete={(blob, duration) => {
                              setAudioBlob(blob);
                              setAudioDuration(duration);
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* Uploaded Files + Links */}
                    {(uploadedFiles.length > 0 || resources.length > 0 || isAddingResource) && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {uploadedFiles.map((file, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md text-xs">
                              <Paperclip className="h-3 w-3" />
                              <span className="truncate max-w-[100px]">{file.name}</span>
                              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          {resources.map((r, i) => (
                            <span key={`link-${i}`} className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md text-xs">
                              <Link2 className="h-3 w-3" />
                              <span className="truncate max-w-[100px]">{r.label}</span>
                              <button onClick={() => handleRemoveResource(i)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add link form */}
                        {isAddingResource ? (
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              value={resourceLabel}
                              onChange={(e) => setResourceLabel(e.target.value)}
                              onKeyDown={handleResourceKeyDown}
                              placeholder="Label (optional)"
                              className="h-7 text-xs flex-1"
                            />
                            <Input
                              type="url"
                              value={resourceUrl}
                              onChange={(e) => setResourceUrl(e.target.value)}
                              onKeyDown={handleResourceKeyDown}
                              onBlur={() => {
                                if (resourceUrl.trim()) {
                                  handleAddResource();
                                } else {
                                  setIsAddingResource(false);
                                }
                              }}
                              placeholder="https://..."
                              autoFocus
                              className="h-7 text-xs flex-[2]"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsAddingResource(true)}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-3 w-3" />
                            Add link
                          </button>
                        )}
                      </div>
                    )}

                    {/* Private Notes */}
                    {showNotesPanel && (
                      <div>
                        <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                          <StickyNote className="h-3 w-3" />
                          Private notes (student won&apos;t see)
                        </label>
                        <textarea
                          value={privateNotes}
                          onChange={(e) => setPrivateNotes(e.target.value)}
                          placeholder="Your notes about this assignment..."
                          rows={2}
                          className="w-full text-xs border border-border/50 rounded-lg p-2 bg-muted/30 resize-none focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt,.mp3,.wav"
            />
          </div>

          {/* Divider */}
          {items.length > 0 && <div className="border-t border-border/30 mb-4" />}

          {/* Active assignments */}
          <div className="space-y-0">
            {activeItems.map((item, index) => {
              const itemSubmissions = submissions[item.id] || [];
              const hasSubmission = item.status === "submitted" || itemSubmissions.length > 0;
              const isExpanded = expandedItemId === item.id;
              const pendingReview = itemSubmissions.filter((s) => s.review_status === "pending");

              return (
                <motion.div
                  key={item.id}
                  data-testid={`homework-item-${item.id}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-border/30 last:border-0"
                >
                  <div className="flex items-start gap-3 py-3">
                    {/* Toggle circle */}
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleComplete(item.id, item.status)}
                      disabled={isPending}
                      data-testid={`homework-complete-toggle-${item.id}`}
                      className="mt-0.5 flex-shrink-0"
                    >
                      <Circle className="h-5 w-5 text-muted-foreground/50 hover:text-primary transition-colors" />
                    </motion.button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-foreground">{item.title}</p>
                        {item.status === "submitted" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                            <MessageSquare className="h-3 w-3" />
                            Submitted
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {item.attachments.length > 0 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            {item.attachments.length} resource{item.attachments.length > 1 ? "s" : ""}
                          </p>
                        )}
                        {hasSubmission && (
                          <button
                            type="button"
                            onClick={() => handleToggleExpand(item.id)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                Hide submission
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                View submission{pendingReview.length > 0 && ` (${pendingReview.length} to review)`}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Due date */}
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDueDate(item.due_date) || "No due date"}
                    </span>
                  </div>

                  {/* Expanded submission panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-4 pl-8">
                          {loadingSubmissions === item.id ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading submission...
                            </div>
                          ) : itemSubmissions.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">
                              No submission yet. Student marked as submitted.
                            </p>
                          ) : (
                            <div className="space-y-4">
                              {itemSubmissions.map((submission) => (
                                <div
                                  key={submission.id}
                                  className="rounded-lg border border-border bg-muted/20 p-4"
                                >
                                  {/* Submission header */}
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs text-muted-foreground">
                                      Submitted {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                                    </span>
                                    <span
                                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                        submission.review_status === "reviewed"
                                          ? "bg-green-100 text-green-700"
                                          : submission.review_status === "needs_revision"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {submission.review_status === "reviewed"
                                        ? "Reviewed"
                                        : submission.review_status === "needs_revision"
                                        ? "Needs revision"
                                        : "Pending review"}
                                    </span>
                                  </div>

                                  {/* Text response */}
                                  {submission.text_response && (
                                    <div className="mb-3">
                                      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                                        <FileText className="h-3.5 w-3.5" />
                                        Written response
                                      </label>
                                      <p className="text-sm text-foreground bg-background rounded-md p-3 whitespace-pre-wrap">
                                        {submission.text_response}
                                      </p>
                                    </div>
                                  )}

                                  {/* Audio response */}
                                  {submission.audio_url && (
                                    <div className="mb-3">
                                      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                                        <Mic className="h-3.5 w-3.5" />
                                        Audio recording
                                      </label>
                                      <div className="flex items-center gap-3">
                                        <audio
                                          id={`audio-${submission.id}`}
                                          src={submission.audio_url}
                                          className="hidden"
                                          onEnded={() => setPlayingAudio(null)}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const audio = document.getElementById(`audio-${submission.id}`) as HTMLAudioElement;
                                            if (playingAudio === submission.id) {
                                              audio.pause();
                                              setPlayingAudio(null);
                                            } else {
                                              // Pause any currently playing
                                              if (playingAudio) {
                                                const prev = document.getElementById(`audio-${playingAudio}`) as HTMLAudioElement;
                                                prev?.pause();
                                              }
                                              audio.play();
                                              setPlayingAudio(submission.id);
                                            }
                                          }}
                                          className="gap-2"
                                        >
                                          {playingAudio === submission.id ? (
                                            <>
                                              <Pause className="h-4 w-4" />
                                              Pause
                                            </>
                                          ) : (
                                            <>
                                              <Play className="h-4 w-4" />
                                              Play recording
                                            </>
                                          )}
                                        </Button>
                                        <a
                                          href={submission.audio_url}
                                          download
                                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                          Download
                                        </a>
                                      </div>
                                    </div>
                                  )}

                                  {/* File attachments */}
                                  {submission.file_attachments && submission.file_attachments.length > 0 && (
                                    <div className="mb-3">
                                      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                                        <Paperclip className="h-3.5 w-3.5" />
                                        Files
                                      </label>
                                      <div className="flex flex-wrap gap-2">
                                        {submission.file_attachments.map((file, idx) => (
                                          <a
                                            key={idx}
                                            href={file.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border text-sm hover:border-primary transition-colors"
                                          >
                                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="truncate max-w-[150px]">{file.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              ({formatFileSize(file.size)})
                                            </span>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Existing feedback display */}
                                  {submission.tutor_feedback && submission.review_status !== "pending" && (
                                    <div className="mb-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
                                      <label className="text-xs font-medium text-primary mb-1 block">
                                        Your feedback
                                      </label>
                                      <p className="text-sm text-foreground">{submission.tutor_feedback}</p>
                                    </div>
                                  )}

                                  {/* Review form - only show if pending */}
                                  {submission.review_status === "pending" && (
                                    <div className="border-t border-border/50 pt-3 mt-3">
                                      <label className="text-xs font-medium text-foreground mb-2 block">
                                        Your feedback
                                      </label>
                                      <textarea
                                        value={reviewFeedback[submission.id] || ""}
                                        onChange={(e) =>
                                          setReviewFeedback((prev) => ({ ...prev, [submission.id]: e.target.value }))
                                        }
                                        placeholder="Great work! Here are some notes..."
                                        rows={3}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                      />
                                      <div className="flex justify-end gap-2 mt-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleReview(submission.id, "needs_revision")}
                                          disabled={isReviewing || !reviewFeedback[submission.id]?.trim()}
                                        >
                                          Needs revision
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => handleReview(submission.id, "reviewed")}
                                          disabled={isReviewing || !reviewFeedback[submission.id]?.trim()}
                                        >
                                          {isReviewing ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                              Saving...
                                            </>
                                          ) : (
                                            "Mark reviewed"
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Completed assignments */}
          {completedItems.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                Completed
              </p>
              <div className="space-y-0">
                {completedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0"
                  >
                    {/* Completed circle */}
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleComplete(item.id, item.status)}
                      disabled={isPending}
                      className="mt-0.5 flex-shrink-0"
                    >
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </motion.button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground line-through">{item.title}</p>
                      {item.attachments.length > 0 && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {item.attachments.length} resource{item.attachments.length > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    {/* Completed label */}
                    <span className="text-xs text-muted-foreground/60 flex-shrink-0">
                      Completed
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
    </div>
  );
}
