"use client";

import type { ReactNode } from "react";

type FormStatusAlertProps = {
  message?: string;
  tone: "error" | "success";
  variant?: "inline" | "banner";
  icon?: ReactNode;
  className?: string;
  textClassName?: string;
  ariaLive?: "polite" | "assertive";
  as?: "div" | "p";
  visuallyHidden?: boolean;
};

const INLINE_TONE_CLASSES: Record<NonNullable<FormStatusAlertProps["tone"]>, string> = {
  error: "text-destructive",
  success: "text-emerald-600",
};

const BANNER_TONE_CLASSES: Record<NonNullable<FormStatusAlertProps["tone"]>, string> = {
  error: "bg-destructive/10 text-destructive",
  success: "bg-emerald-100 text-emerald-700",
};

export function FormStatusAlert({
  message,
  tone,
  variant = "banner",
  icon,
  className,
  textClassName,
  ariaLive,
  as = "div",
  visuallyHidden = false,
}: FormStatusAlertProps) {
  if (!message) return null;

  const Component = as;
  const baseClassName =
    variant === "inline"
      ? `flex items-center gap-2 text-sm ${INLINE_TONE_CLASSES[tone]}`
      : `rounded-md px-3 py-2 text-sm ${BANNER_TONE_CLASSES[tone]}`;
  const combinedClassName = [baseClassName, className].filter(Boolean).join(" ");
  const content = visuallyHidden ? (
    <span className="sr-only">{message}</span>
  ) : (
    <span className={textClassName}>{message}</span>
  );

  return (
    <Component className={combinedClassName} aria-live={ariaLive}>
      {icon ? <span className="flex-shrink-0">{icon}</span> : null}
      {content}
    </Component>
  );
}
