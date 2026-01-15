"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { Mail, Phone, Globe2, Target, FileText, Calendar, Clock, Plus, X, Tag } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { updateStudentLabels, updateStudent } from "@/lib/actions/students";
import { EditableSection } from "@/components/students/EditableSection";

type StudentData = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  proficiency_level: string | null;
  learning_goals: string | null;
  native_language: string | null;
  notes: string | null;
  status: string | null;
  labels: string[] | null;
  created_at: string | null;
  updated_at: string | null;
};

type StudentDetailsTabProps = {
  student: StudentData;
};

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "elementary", label: "Elementary" },
  { value: "intermediate", label: "Intermediate" },
  { value: "upper_intermediate", label: "Upper Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "proficient", label: "Proficient" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "paused", label: "Paused" },
  { value: "alumni", label: "Alumni" },
];

export function StudentDetailsTab({ student }: StudentDetailsTabProps) {
  const [labels, setLabels] = useState<string[]>(student.labels ?? []);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  // Editable fields state
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<StudentData>>({
    full_name: student.full_name,
    email: student.email,
    phone: student.phone,
    native_language: student.native_language,
    proficiency_level: student.proficiency_level,
    learning_goals: student.learning_goals,
    notes: student.notes,
    status: student.status,
  });
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = (section: string, fields: (keyof StudentData)[]) => {
    setSaveError(null);
    startTransition(async () => {
      const updates: Record<string, unknown> = {};
      for (const field of fields) {
        updates[field] = formData[field];
      }
      const result = await updateStudent(student.id, updates);
      if (result.error) {
        setSaveError(result.error);
      } else {
        setEditingSection(null);
      }
    });
  };

  const handleCancel = () => {
    // Reset form data to original student data
    setFormData({
      full_name: student.full_name,
      email: student.email,
      phone: student.phone,
      native_language: student.native_language,
      proficiency_level: student.proficiency_level,
      learning_goals: student.learning_goals,
      notes: student.notes,
      status: student.status,
    });
    setEditingSection(null);
    setSaveError(null);
  };

  const handleEdit = (section: string) => {
    setSaveError(null);
    setEditingSection(section);
  };

  const handleAddLabel = () => {
    const trimmed = newLabel.trim();
    if (!trimmed || labels.includes(trimmed)) {
      setNewLabel("");
      setIsAddingLabel(false);
      return;
    }

    const updated = [...labels, trimmed];
    setLabels(updated);
    setNewLabel("");
    setIsAddingLabel(false);

    startTransition(async () => {
      await updateStudentLabels(student.id, updated);
    });
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    const updated = labels.filter((l) => l !== labelToRemove);
    setLabels(updated);

    startTransition(async () => {
      await updateStudentLabels(student.id, updated);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddLabel();
    } else if (e.key === "Escape") {
      setNewLabel("");
      setIsAddingLabel(false);
    }
  };

  const recordMetadata = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Student Since</p>
          <p className="text-sm font-medium text-foreground">
            {student.created_at ? formatDate(student.created_at) : "Unknown"}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Updated</p>
          <p className="text-sm font-medium text-foreground">
            {student.updated_at ? formatDate(student.updated_at) : "Never"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Labels */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Labels</h3>
          </div>
          {!isAddingLabel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingLabel(true)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add label
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {labels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-xs text-muted-foreground"
            >
              {label}
              <button
                type="button"
                onClick={() => handleRemoveLabel(label)}
                className="ml-0.5 hover:text-foreground transition-colors"
                disabled={isPending}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {isAddingLabel && (
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (newLabel.trim()) {
                  handleAddLabel();
                } else {
                  setIsAddingLabel(false);
                }
              }}
              placeholder="Type label..."
              autoFocus
              className="px-2.5 py-1 text-xs border border-border rounded-md bg-background text-foreground w-28 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
        </div>

        {labels.length === 0 && !isAddingLabel && (
          <p className="text-xs text-muted-foreground">No labels yet</p>
        )}
      </div>

      {/* Contact Information */}
      <EditableSection
        title="Contact Information"
        isEditing={editingSection === "contact"}
        isPending={isPending}
        error={editingSection === "contact" ? saveError : null}
        onEdit={() => handleEdit("contact")}
        onCancel={handleCancel}
        onSave={() => handleSave("contact", ["email", "phone", "native_language"])}
        viewContent={
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                <a
                  href={`mailto:${student.email}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {student.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                {student.phone ? (
                  <a
                    href={`tel:${student.phone}`}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {student.phone}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Not provided</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Globe2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Native Language</p>
                <p className="text-sm font-medium text-foreground">
                  {student.native_language || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        }
        editContent={
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Email</label>
              <input
                type="email"
                value={formData.email ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value || null }))}
                placeholder="Not provided"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Native Language</label>
              <input
                type="text"
                value={formData.native_language ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, native_language: e.target.value || null }))}
                placeholder="Not specified"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        }
      />

      {/* Learning Goals */}
      <EditableSection
        header={
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Learning Goals</h3>
          </div>
        }
        isEditing={editingSection === "goals"}
        isPending={isPending}
        error={editingSection === "goals" ? saveError : null}
        onEdit={() => handleEdit("goals")}
        onCancel={handleCancel}
        onSave={() => handleSave("goals", ["learning_goals", "proficiency_level"])}
        viewContent={
          <>
            {formData.proficiency_level && (
              <p className="text-xs text-muted-foreground mb-2">
                Level:{" "}
                {PROFICIENCY_LEVELS.find((l) => l.value === formData.proficiency_level)?.label ??
                  formData.proficiency_level}
              </p>
            )}
            {student.learning_goals ? (
              <p className="text-sm text-foreground leading-relaxed">{student.learning_goals}</p>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
                <p className="text-sm text-muted-foreground">No learning goals recorded yet</p>
              </div>
            )}
          </>
        }
        editContent={
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Proficiency Level</label>
              <select
                value={formData.proficiency_level ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, proficiency_level: e.target.value || null }))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Not specified</option>
                {PROFICIENCY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Learning Goals</label>
              <textarea
                value={formData.learning_goals ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, learning_goals: e.target.value || null }))}
                placeholder="What are their learning objectives?"
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>
        }
      />

      {/* Private Notes */}
      <EditableSection
        header={
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Private Notes</h3>
            <span className="text-xs text-muted-foreground">(Only visible to you)</span>
          </div>
        }
        isEditing={editingSection === "notes"}
        isPending={isPending}
        error={editingSection === "notes" ? saveError : null}
        onEdit={() => handleEdit("notes")}
        onCancel={handleCancel}
        onSave={() => handleSave("notes", ["notes"])}
        viewContent={
          student.notes ? (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{student.notes}</p>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">No private notes added yet</p>
            </div>
          )
        }
        editContent={
          <textarea
            value={formData.notes ?? ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value || null }))}
            placeholder="Add private notes about this student..."
            rows={5}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        }
      />

      {/* Metadata */}
      <EditableSection
        title="Student Record"
        editLabel="Edit Status"
        isEditing={editingSection === "status"}
        isPending={isPending}
        error={editingSection === "status" ? saveError : null}
        onEdit={() => handleEdit("status")}
        onCancel={handleCancel}
        onSave={() => handleSave("status", ["status"])}
        viewContent={recordMetadata}
        editContent={
          <>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Status</label>
              <select
                value={formData.status ?? "active"}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {recordMetadata}
          </>
        }
      />
    </div>
  );
}
