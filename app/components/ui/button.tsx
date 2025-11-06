"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-brand-brown text-brand-white hover:bg-brand-brown/90 focus-visible:ring-brand-brown",
  secondary:
    "bg-brand-brown/10 text-brand-brown hover:bg-brand-brown/20 focus-visible:ring-brand-brown/40",
  outline:
    "border border-input bg-background text-foreground hover:bg-muted focus-visible:ring-brand-brown/40",
  ghost: "text-muted-foreground hover:bg-muted focus-visible:ring-brand-brown/40",
  link: "text-brand-brown underline-offset-4 hover:underline focus-visible:ring-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-8 text-base",
  icon: "h-10 w-10",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
