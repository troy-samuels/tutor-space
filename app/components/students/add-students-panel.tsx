"use client";

import { useState, useTransition } from "react";
import { Upload, Plus, FileText, ChevronDown, ChevronUp, CheckCircle2, PlayCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import { StudentDetailView } from "@/components/students/StudentDetailView";
import {
  importStudentsBatch,
  type StudentImportPayload,
  type StudentImportResult,
} from "@/lib/actions/students";

// Maximum CSV file size: 5MB
const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024;
// Maximum number of rows in a single import
const MAX_IMPORT_ROWS = 1000;

const CSV_TEMPLATE = `full_name,email,phone,proficiency_level,status,learning_goals,native_language,notes
Jane Doe,jane@example.com,+12025550111,Intermediate,Active,"Exam prep","English","Prefers Monday sessions"
Leo Kim,leo@example.com,,Beginner,Trial,"Travel readiness","Korean","Parent is main contact"
`;

type Student = {
  id: string;
  fullName: string;
  email: string;
  status?: string;
  onboardingStatus?: string;
  engagementScore?: number;
};

type Props = {
  students: Student[];
  onStudentAdded?: () => void;
};

export function AddStudentsPanel({ students, onStudentAdded }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvResult, setCsvResult] = useState<StudentImportResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim() || !email.trim()) {
      setFeedback({ type: "error", message: "Name and email are required." });
      return;
    }

    const payload: StudentImportPayload = {
      full_name: name.trim(),
      email: email.trim(),
      phone: undefined,
      status: undefined,
      proficiency_level: undefined,
      learning_goals: undefined,
      native_language: undefined,
      notes: undefined,
    };

    startTransition(async () => {
      const result = await importStudentsBatch([payload]);
      if (result.success) {
        setFeedback({ type: "success", message: "Student added" });
        setName("");
        setEmail("");
        onStudentAdded?.();
        // Clear success message after 3 seconds
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({
          type: "error",
          message: result.errors[0]?.message ?? "Failed to add student.",
        });
      }
    });
  };

  const handleCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCsvErrors([]);
    setCsvResult(null);

    if (!file) return;

    if (file.size > MAX_CSV_SIZE_BYTES) {
      setCsvErrors(["File too large. Maximum size is 5MB."]);
      return;
    }

    try {
      const text = await file.text();
      const { rows, errors } = parseCsv(text);

      if (errors.length > 0) {
        setCsvErrors(errors);
        return;
      }

      if (rows.length === 0) {
        setCsvErrors(["No data rows found in this CSV."]);
        return;
      }

      if (rows.length > MAX_IMPORT_ROWS) {
        setCsvErrors([`Too many rows. Maximum is ${MAX_IMPORT_ROWS} students per import.`]);
        return;
      }

      // Import the students
      startTransition(async () => {
        const result = await importStudentsBatch(rows);
        setCsvResult(result);
        if (result.success) {
          onStudentAdded?.();
        }
      });
    } catch {
      setCsvErrors(["Couldn't read file. Please try a UTF-8 CSV."]);
    }
  };

  const statusStyles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    trial: "bg-amber-100 text-amber-700",
    paused: "bg-gray-100 text-gray-600",
    alumni: "bg-sky-100 text-sky-700",
  };

  const onboardingIcons: Record<string, React.ReactNode> = {
    not_started: null,
    in_progress: <PlayCircle className="h-3.5 w-3.5 text-blue-500" />,
    completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
  };

  return (
    <div className="space-y-6">
      {/* Inline Add Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Student name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              className="h-10"
            />
          </div>
          <div className="flex-1">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              className="h-10"
            />
          </div>
          <Button type="submit" disabled={isPending} className="h-10 px-6">
            <Plus className="mr-1.5 h-4 w-4" />
            {isPending ? "Adding..." : "Add"}
          </Button>
        </div>

        {/* Feedback */}
        {feedback && (
          <p
            className={`text-sm ${
              feedback.type === "success" ? "text-emerald-600" : "text-destructive"
            }`}
          >
            {feedback.message}
          </p>
        )}

        {/* CSV Import Link */}
        <button
          type="button"
          onClick={() => setShowCsvImport(!showCsvImport)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Upload className="h-3 w-3" />
          Import from CSV
          {showCsvImport ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </form>

      {/* Collapsible CSV Import */}
      {showCsvImport && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
              <FileText className="h-4 w-4" />
              Select CSV
              <Input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleCsvFile}
                disabled={isPending}
              />
            </label>
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
              download="students-template.csv"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Download template
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            Required columns: <strong>full_name</strong> and <strong>email</strong>
          </p>

          {csvErrors.length > 0 && (
            <div className="text-sm text-destructive">
              {csvErrors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}

          {csvResult && (
            <p className={`text-sm ${csvResult.success ? "text-emerald-600" : "text-destructive"}`}>
              {csvResult.success
                ? `${csvResult.imported} student${csvResult.imported === 1 ? "" : "s"} imported`
                : `Import failed: ${csvResult.errors[0]?.message}`}
            </p>
          )}
        </div>
      )}

      {/* Student List */}
      <div className="space-y-2">
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No students yet. Add your first student above.
          </p>
        ) : (
          students.map((student) => {
            const initials = student.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            const status = student.status?.toLowerCase() ?? "active";
            const statusClass = statusStyles[status] ?? statusStyles.active;

            return (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-white/90 px-4 py-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                onClick={() => {
                  setActiveStudentId(student.id);
                  setSheetOpen(true);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveStudentId(student.id);
                    setSheetOpen(true);
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{student.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {student.onboardingStatus && onboardingIcons[student.onboardingStatus] && (
                    <span title={`Onboarding: ${student.onboardingStatus.replace("_", " ")}`}>
                      {onboardingIcons[student.onboardingStatus]}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusClass}`}
                  >
                    {status}
                  </span>
                  <Link
                    href={`/messages?student=${student.id}`}
                    className="text-xs font-semibold text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                    title="Message"
                  >
                    Message
                  </Link>
                  <Link
                    href={`/bookings?student=${student.id}`}
                    className="text-xs font-semibold text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                    title="Book"
                  >
                    Book
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side="right">
        <SheetOverlay className="backdrop-blur-sm" />
        <SheetContent className="w-full max-w-3xl bg-background">
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            {activeStudentId ? (
              <StudentDetailView
                studentId={activeStudentId}
                onClose={() => setSheetOpen(false)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Select a student to view details.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function parseCsv(text: string): { rows: StudentImportPayload[]; errors: string[] } {
  const rows: StudentImportPayload[] = [];
  const errors: string[] = [];

  const trimmed = text.trim();
  if (!trimmed) {
    return { rows, errors: ["CSV file is empty."] };
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows, errors: ["CSV file is empty."] };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  if (!headers.includes("full_name") || !headers.includes("email")) {
    errors.push("CSV must include 'full_name' and 'email' headers.");
    return { rows, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = splitCsvLine(line);
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx]?.trim() ?? "";
    });

    if (!record.full_name || !record.email) {
      errors.push(`Row ${i + 1}: Missing full_name or email.`);
      continue;
    }

    rows.push({
      rowIndex: i + 1,
      full_name: record.full_name,
      email: record.email,
      phone: record.phone || undefined,
      proficiency_level: record.proficiency_level || undefined,
      learning_goals: record.learning_goals || undefined,
      native_language: record.native_language || undefined,
      notes: record.notes || undefined,
      status: record.status || undefined,
    });
  }

  return { rows, errors };
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}
