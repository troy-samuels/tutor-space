"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { Mail, Phone, Globe2, Target, FileText, Calendar, Clock, Plus, X, Tag } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { updateStudentLabels } from "@/lib/actions/students";

type StudentDetailsTabProps = {
  student: {
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
};

export function StudentDetailsTab({ student }: StudentDetailsTabProps) {
  const [labels, setLabels] = useState<string[]>(student.labels ?? []);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [isPending, startTransition] = useTransition();

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
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Contact Information</h3>
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
      </div>

      {/* Learning Goals */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Learning Goals</h3>
        </div>
        {student.learning_goals ? (
          <p className="text-sm text-foreground leading-relaxed">
            {student.learning_goals}
          </p>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No learning goals recorded yet
            </p>
          </div>
        )}
      </div>

      {/* Private Notes */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Private Notes</h3>
          <span className="text-xs text-muted-foreground">(Only visible to you)</span>
        </div>
        {student.notes ? (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {student.notes}
          </p>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No private notes added yet
            </p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Student Record</h3>
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
      </div>
    </div>
  );
}
