"use client";

/**
 * GameButton — standardised game action button
 *
 * Variants:
 *   primary  — filled dark (#2D2A26), white text — for Submit, Next, main CTA
 *   accent   — filled brand orange (#D36135), white text — for Share
 *   secondary — elevated surface (#F5EDE8), dark text — for Shuffle, Deselect, secondary actions
 *   outline  — white bg, subtle border — for tertiary actions (Review, Show path)
 *
 * All variants: min-h-[48px], rounded-xl, consistent font-size/weight,
 *               whileTap scale 0.96, touch-manipulation.
 */

import { motion } from "framer-motion";
import * as React from "react";

type ButtonVariant = "primary" | "accent" | "secondary" | "outline";

interface GameButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  /** Full-width by default */
  fullWidth?: boolean;
  /** aria-label for icon-only buttons */
  "aria-label"?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "#2D2A26",
    color: "#FFFFFF",
    border: "none",
  },
  accent: {
    background: "#D36135",
    color: "#FFFFFF",
    border: "none",
  },
  secondary: {
    background: "#F5EDE8",
    color: "#6B6560",
    border: "1px solid rgba(0,0,0,0.06)",
  },
  outline: {
    background: "#FFFFFF",
    color: "#6B6560",
    border: "1px solid rgba(0,0,0,0.10)",
  },
};

export default function GameButton({
  onClick,
  disabled = false,
  variant = "primary",
  children,
  className = "",
  type = "button",
  fullWidth = true,
  "aria-label": ariaLabel,
}: GameButtonProps) {
  const baseStyle = VARIANT_STYLES[variant];

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      aria-label={ariaLabel}
      className={`
        inline-flex items-center justify-center gap-2
        min-h-[48px] rounded-xl px-5
        text-[14px] font-semibold
        select-none touch-manipulation
        transition-opacity duration-100
        disabled:opacity-30 disabled:cursor-not-allowed
        ${fullWidth ? "w-full" : ""}
        ${className}
      `.trim()}
      style={{
        ...baseStyle,
        ...(disabled ? { opacity: 0.3 } : {}),
      }}
    >
      {children}
    </motion.button>
  );
}
