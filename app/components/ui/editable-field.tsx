"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FieldType = "text" | "textarea" | "number";

type EditableFieldProps = {
  label: string;
  value: string | number | undefined;
  placeholder?: string;
  fieldType?: FieldType;
  min?: number;
  max?: number;
  emptyText?: string;
  displayFormatter?: (value: string | number) => ReactNode;
  onValueChange: (value: string | number | undefined) => void;
  isActive?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  className?: string;
};

export function EditableField({
  label,
  value,
  placeholder,
  fieldType = "text",
  min,
  max,
  emptyText = "Add...",
  displayFormatter,
  onValueChange,
  isActive = false,
  onActivate,
  onDeactivate,
  className,
}: EditableFieldProps) {
  const [localValue, setLocalValue] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Sync local value with prop
  useEffect(() => {
    if (!isActive) {
      setLocalValue(value ?? "");
    }
  }, [value, isActive]);

  // Focus input when activated
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isActive]);

  const handleClick = () => {
    if (!isActive) {
      onActivate?.();
    }
  };

  const handleSave = useCallback(() => {
    let normalized: string | number | undefined;
    if (fieldType === "number") {
      const parsed =
        typeof localValue === "string" ? Number(localValue) : localValue;
      normalized = Number.isFinite(parsed)
        ? Math.min(Math.max(parsed, min ?? 0), max ?? Infinity)
        : undefined;
    } else {
      const trimmed = String(localValue).trim();
      normalized = trimmed || undefined;
    }

    onValueChange(normalized);
    onDeactivate?.();
  }, [localValue, fieldType, min, max, onValueChange, onDeactivate]);

  const handleCancel = () => {
    setLocalValue(value ?? "");
    onDeactivate?.();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && fieldType !== "textarea") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is within our component (save/cancel buttons)
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest("[data-editable-field-actions]")) {
      return;
    }
    // Auto-save on blur
    if (isActive) {
      handleSave();
    }
  };

  const isEmpty = value === undefined || value === "" || value === null;
  const displayContent = isEmpty
    ? emptyText
    : displayFormatter
      ? displayFormatter(value!)
      : String(value);

  const duration = shouldReduceMotion ? 0 : 0.2;
  const contentDuration = shouldReduceMotion ? 0 : 0.15;
  const easing = [0.25, 0.1, 0.25, 1] as const;

  const containerVariants = {
    display: {
      height: "auto",
      transition: { duration, ease: easing },
    },
    edit: {
      height: "auto",
      transition: { duration, ease: easing },
    },
  };

  const contentVariants = {
    initial: { opacity: 0, y: -4 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: contentDuration, ease: easing },
    },
    exit: {
      opacity: 0,
      y: 4,
      transition: { duration: shouldReduceMotion ? 0 : 0.1 },
    },
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs uppercase tracking-wide text-stone-500 block">
        {label}
      </label>

      <motion.div
        layout
        variants={containerVariants}
        animate={isActive ? "edit" : "display"}
        className="relative"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isActive ? (
            <motion.div
              key="edit"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative"
            >
              {fieldType === "textarea" ? (
                <Textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  placeholder={placeholder}
                  className="min-h-[80px] rounded-xl border-stone-300 bg-white text-sm resize-none focus:ring-2 focus:ring-stone-300 focus:border-stone-400 pr-16"
                  rows={3}
                />
              ) : (
                <Input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type={fieldType === "number" ? "number" : "text"}
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  placeholder={placeholder}
                  min={min}
                  max={max}
                  className="rounded-xl border-stone-300 bg-white text-sm focus:ring-2 focus:ring-stone-300 focus:border-stone-400 pr-16"
                />
              )}

              <div
                data-editable-field-actions
                className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5"
              >
                <button
                  type="button"
                  onClick={handleCancel}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                  aria-label="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                  aria-label="Save"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="display"
              type="button"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={handleClick}
              aria-label={`Edit ${label}`}
              aria-expanded={isActive}
              className={cn(
                "group w-full text-left rounded-xl px-3.5 py-2.5 transition-all duration-150",
                "border border-transparent hover:border-stone-200 hover:bg-stone-50/70",
                "focus:outline-none focus:ring-2 focus:ring-stone-200 focus:ring-offset-1",
                isEmpty
                  ? "bg-stone-50/50 border-dashed border-stone-200"
                  : "bg-stone-50/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "text-sm leading-relaxed flex-1",
                    isEmpty ? "text-stone-400 italic" : "text-stone-700"
                  )}
                >
                  {displayContent}
                </span>
                <Pencil
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 mt-0.5 transition-opacity duration-150",
                    isEmpty
                      ? "text-stone-400 opacity-100"
                      : "text-stone-400 opacity-0 group-hover:opacity-100"
                  )}
                />
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
