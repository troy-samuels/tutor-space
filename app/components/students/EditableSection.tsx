"use client";

import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactStatusAlert } from "@/components/ui/status-alert";

type EditableSectionProps = {
  title?: string;
  header?: ReactNode;
  editLabel?: string;
  saveLabel?: string;
  pendingLabel?: string;
  isEditing: boolean;
  isPending?: boolean;
  error?: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  viewContent: ReactNode;
  editContent: ReactNode;
};

export function EditableSection({
  title,
  header,
  editLabel = "Edit",
  saveLabel = "Save",
  pendingLabel = "Saving...",
  isEditing,
  isPending = false,
  error,
  onEdit,
  onCancel,
  onSave,
  viewContent,
  editContent,
}: EditableSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        {header ?? <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
        {isEditing ? (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-7 px-2 text-xs"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              className="h-7 px-2 text-xs"
              disabled={isPending}
            >
              {isPending ? pendingLabel : saveLabel}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3 w-3 mr-1" />
            {editLabel}
          </Button>
        )}
      </div>
      {error && isEditing ? (
        <CompactStatusAlert status="error" message={error} className="mb-3" />
      ) : null}
      {isEditing ? editContent : viewContent}
    </div>
  );
}
