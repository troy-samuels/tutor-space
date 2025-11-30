"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import type { LinkRecord } from "@/lib/actions/links";
import { LinkEditor } from "@/components/marketing/link-editor";
import type { LinkFormValues } from "@/lib/validators/link";

type LinkItemProps = {
  link: LinkRecord;
  onChange: (values: LinkFormValues) => Promise<boolean>;
  onToggleVisibility: () => void;
  onDelete: () => void;
};

export function SortableLinkItem({ link, onChange, onToggleVisibility, onDelete }: LinkItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const linkValues: LinkFormValues = {
    title: link.title,
    url: link.url,
    description: link.description ?? "",
    icon_url: link.icon_url ?? "",
    button_style: (link.button_style as LinkFormValues["button_style"]) ?? "default",
    is_visible: link.is_visible,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-border bg-white px-4 py-4 shadow-sm transition ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 items-start gap-3">
          <button
            type="button"
            className="mt-1 text-muted-foreground transition hover:text-primary focus:outline-none"
            {...listeners}
            {...attributes}
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div>
            <p className="text-sm font-semibold text-foreground">{link.title}</p>
            <p className="text-xs text-muted-foreground break-all">{link.url}</p>
            {link.description ? (
              <p className="mt-1 text-xs text-muted-foreground">{link.description}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>{link.button_style ?? "default"}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                {link.is_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {link.is_visible ? "Visible" : "Hidden"}
              </span>
              <span>{link.click_count ?? 0} clicks</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Edit link"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleVisibility}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label={link.is_visible ? "Hide link" : "Show link"}
          >
            {link.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-destructive transition hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive/40"
            aria-label="Remove link"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/50 p-4">
          <LinkEditor
            variant="update"
            initialValues={linkValues}
            onSubmit={async (values, reset) => {
              const ok = await onChange(values);
              if (ok) {
                setIsEditing(false);
                reset();
              }
            }}
          />
        </div>
      ) : null}
    </li>
  );
}
