"use client";

import { useMemo, useState, useTransition } from "react";
import { Upload, FileText, UserPlus, CheckCircle2, AlertTriangle, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  importStudentsBatch,
  type StudentImportPayload,
  type StudentImportResult,
} from "@/lib/actions/students";
import { useAuth } from "@/lib/hooks/useAuth";

type ParsedStudent = StudentImportPayload;

type ManualFormState = {
  full_name: string;
  email: string;
  phone: string;
  proficiency_level: string;
  native_language: string;
  learning_goals: string;
  notes: string;
  status: string;
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "paused", label: "Paused" },
  { value: "alumni", label: "Alumni" },
];

const CSV_TEMPLATE = `full_name,email,phone,proficiency_level,status,learning_goals,native_language,notes
Jane Doe,jane@example.com,+12025550111,Intermediate,Active,"Exam prep","English","Prefers Monday sessions"
Leo Kim,leo@example.com,,Beginner,Trial,"Travel readiness","Korean","Parent is main contact"
`;

export function AddStudentsPanel() {
  const [mode, setMode] = useState<"csv" | "manual">("csv");
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [csvParseErrors, setCsvParseErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<StudentImportResult | null>(null);
  const [manualForm, setManualForm] = useState<ManualFormState>({
    full_name: "",
    email: "",
    phone: "",
    proficiency_level: "",
    native_language: "",
    learning_goals: "",
    notes: "",
    status: "active",
  });
  const [manualFeedback, setManualFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { profile } = useAuth();
  const bookingLink = profile?.username ? `/book/${profile.username}` : null;

  const templateHref = useMemo(() => {
    return `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`;
  }, []);

  const handleModeChange = (nextMode: "csv" | "manual") => {
    setMode(nextMode);
    setImportResult(null);
    setManualFeedback(null);
  };

  const handleCsvFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImportResult(null);
    setCsvParseErrors([]);

    if (!file) {
      setParsedStudents([]);
      return;
    }

    try {
      const text = await file.text();
      const { rows, errors } = parseCsv(text);
      setParsedStudents(rows);
      setCsvParseErrors(errors);
      if (errors.length === 0 && rows.length === 0) {
        setCsvParseErrors(["No data rows found in this CSV."]);
      }
    } catch (error) {
      setParsedStudents([]);
      setCsvParseErrors(["We couldn't read that file. Please try again with a UTF-8 CSV."]);
      console.error("[Students] Failed to read CSV", error);
    }
  };

  const handleCsvImport = () => {
    if (parsedStudents.length === 0) {
      setCsvParseErrors(["Add at least one row before importing."]);
      return;
    }

    setImportResult(null);
    setCsvParseErrors([]);
    startTransition(async () => {
      const result = await importStudentsBatch(parsedStudents);
      setImportResult(result);
      if (result.success) {
        setParsedStudents([]);
      }
    });
  };

  const handleManualChange = (field: keyof ManualFormState, value: string) => {
    setManualForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetManualForm = () => {
    setManualForm({
      full_name: "",
      email: "",
      phone: "",
      proficiency_level: "",
      native_language: "",
      learning_goals: "",
      notes: "",
      status: "active",
    });
  };

  const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManualFeedback(null);

    if (!manualForm.full_name.trim() || !manualForm.email.trim()) {
      setManualFeedback({
        type: "error",
        message: "Full name and email are required.",
      });
      return;
    }

    const payload: StudentImportPayload = {
      full_name: manualForm.full_name.trim(),
      email: manualForm.email.trim(),
      phone: manualForm.phone.trim() || undefined,
      proficiency_level: manualForm.proficiency_level.trim() || undefined,
      native_language: manualForm.native_language.trim() || undefined,
      learning_goals: manualForm.learning_goals.trim() || undefined,
      notes: manualForm.notes.trim() || undefined,
      status: manualForm.status,
    };

    startTransition(async () => {
      const result = await importStudentsBatch([payload]);
      if (result.success) {
        setManualFeedback({
          type: "success",
          message: "Student added.",
        });
        resetManualForm();
      } else {
        setManualFeedback({
          type: "error",
          message:
            result.errors[0]?.message ??
            "We couldn’t add that student. Double-check email and try again.",
        });
      }
    });
  };

  const csvPreviewHeaders = ["Full name", "Email", "Phone", "Status", "Proficiency"];
  const csvPreviewRows = parsedStudents.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleModeChange("csv")}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            mode === "csv"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload CSV
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("manual")}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            mode === "manual"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Manual entry
        </button>
      </div>

      {mode === "csv" ? (
        <section className="rounded-3xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Upload a CSV</h2>
            <p className="text-sm text-muted-foreground">
              Required columns: <strong>full_name</strong> and <strong>email</strong>. Optional
              columns include phone, proficiency_level, status, native_language, learning_goals, and
              notes.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10">
              <FileText className="h-4 w-4" />
              <span>Select CSV</span>
              <Input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleCsvFile}
              />
            </label>
            <Button variant="outline" size="sm" asChild>
              <a href={templateHref} download="tutorlingua-students-template.csv">
                Download template
              </a>
            </Button>
          </div>

          {csvParseErrors.length > 0 && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <p className="font-semibold">We found {csvParseErrors.length} issue(s):</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {csvParseErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {parsedStudents.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Ready to import <strong>{parsedStudents.length}</strong>{" "}
                  {parsedStudents.length === 1 ? "student" : "students"}.
                </p>
                <Button onClick={handleCsvImport} disabled={isPending} className="min-w-[160px]">
                  {isPending ? "Importing..." : "Import students"}
                </Button>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      {csvPreviewHeaders.map((header) => (
                        <th key={header} className="px-4 py-2 text-left font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {csvPreviewRows.map((row, index) => (
                      <tr key={`${row.email}-${index}`}>
                        <td className="px-4 py-2">{row.full_name}</td>
                        <td className="px-4 py-2">{row.email}</td>
                        <td className="px-4 py-2">{row.phone ?? "—"}</td>
                        <td className="px-4 py-2 text-xs capitalize">
                          {row.status ? row.status : "—"}
                        </td>
                        <td className="px-4 py-2">{row.proficiency_level ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedStudents.length > csvPreviewRows.length && (
                  <p className="px-4 py-3 text-xs text-muted-foreground">
                    Showing first {csvPreviewRows.length} rows.
                  </p>
                )}
              </div>
            </div>
          )}

          {importResult && (
            <ImportResultNotice result={importResult} bookingLink={bookingLink} />
          )}
        </section>
      ) : (
        <section className="rounded-3xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Add an individual student</h2>
            <p className="text-sm text-muted-foreground">
              We’ll create the record immediately. Add as many students as you need—one per submit.
            </p>
          </div>

          {manualFeedback && (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                manualFeedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
              }`}
            >
              <p>{manualFeedback.message}</p>
              {manualFeedback.type === "success" && bookingLink ? (
                <ShareAvailabilityActions bookingLink={bookingLink} />
              ) : null}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleManualSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Full name*</label>
                <Input
                  value={manualForm.full_name}
                  onChange={(event) => handleManualChange("full_name", event.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Email*</label>
                <Input
                  type="email"
                  value={manualForm.email}
                  onChange={(event) => handleManualChange("email", event.target.value)}
                  placeholder="jane@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Phone</label>
                <Input
                  value={manualForm.phone}
                  onChange={(event) => handleManualChange("phone", event.target.value)}
                  placeholder="+1 202 555 0111"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Status</label>
                <select
                  value={manualForm.status}
                  onChange={(event) => handleManualChange("status", event.target.value)}
                  className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-muted-foreground">Proficiency</label>
                <Input
                  value={manualForm.proficiency_level}
                  onChange={(event) =>
                    handleManualChange("proficiency_level", event.target.value)
                  }
                  placeholder="Intermediate"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-muted-foreground">Native language</label>
                <Input
                  value={manualForm.native_language}
                  onChange={(event) =>
                    handleManualChange("native_language", event.target.value)
                  }
                  placeholder="English"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-muted-foreground">Learning goals</label>
                <Input
                  value={manualForm.learning_goals}
                  onChange={(event) =>
                    handleManualChange("learning_goals", event.target.value)
                  }
                  placeholder="DELE B2 prep"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Notes</label>
              <textarea
                value={manualForm.notes}
                onChange={(event) => handleManualChange("notes", event.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Any extra context you want to remember."
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Add student"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetManualForm}
                className="text-muted-foreground"
              >
                Clear form
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

function ImportResultNotice({ result, bookingLink }: { result: StudentImportResult; bookingLink?: string | null }) {
  if (result.success) {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {result.imported} {result.imported === 1 ? "student imported" : "students imported"}.
        </div>
        {bookingLink ? <ShareAvailabilityActions bookingLink={bookingLink} /> : null}
      </div>
    );
  }

  if (result.errors.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" />
        We couldn’t import every row.
      </p>
      {result.imported > 0 && (
        <p className="mt-1 text-xs text-destructive/80">
          Imported {result.imported} {result.imported === 1 ? "student" : "students"} before hitting
          the following errors:
        </p>
      )}
      <ErrorList errors={result.errors} />
    </div>
  );
}

function ErrorList({
  errors,
}: {
  errors: StudentImportResult["errors"];
}) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-destructive">
      {errors.map((error, index) => (
        <li key={`${error.row}-${index}`}>
          Row {error.row}
          {error.email ? ` (${error.email})` : ""}: {error.message}
        </li>
      ))}
    </ul>
  );
}

function ShareAvailabilityActions({ bookingLink }: { bookingLink: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const absoluteUrl =
        typeof window !== "undefined"
          ? new URL(bookingLink, window.location.origin).toString()
          : bookingLink;
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("[Students] Failed to copy availability link", error);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      <Button asChild size="sm">
        <a href={bookingLink} target="_blank" rel="noopener noreferrer">
          <LinkIcon className="mr-2 h-3.5 w-3.5" />
          View availability page
        </a>
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleCopy}
        className="text-muted-foreground"
      >
        {copied ? "Link copied" : "Copy booking link"}
      </Button>
    </div>
  );
}

function parseCsv(text: string): { rows: ParsedStudent[]; errors: string[] } {
  const rows: ParsedStudent[] = [];
  const errors: string[] = [];

  const trimmed = text.trim();
  if (!trimmed) {
    return { rows, errors: ["CSV file is empty."] };
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows, errors: ["CSV file is empty."] };
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  if (!headers.includes("full_name") || !headers.includes("email")) {
    errors.push("CSV must include 'full_name' and 'email' headers.");
    return { rows, errors };
  }

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }
    const values = splitCsvLine(line);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index]?.trim() ?? "";
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

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
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
