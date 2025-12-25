"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Available button style variants.
 * - `default`: Primary action button with brand color background
 * - `secondary`: Secondary action with accent color
 * - `outline`: Bordered button with transparent background
 * - `ghost`: Minimal button with hover background
 * - `link`: Text-only button styled as a link
 * - `destructive`: Danger/delete actions with red theme
 */
type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";

/**
 * Button size options following the design system scale.
 * - `default`: Standard 40px height (h-10)
 * - `sm`: Compact 36px height (h-9)
 * - `lg`: Large 44px height (h-11)
 * - `icon`: Square 40px for icon-only buttons
 */
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-primary-button text-primary-foreground hover:bg-primary-button/90 focus-visible:ring-primary",
  secondary:
    "bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent/40",
  outline:
    "bg-background text-foreground hover:bg-muted focus-visible:ring-primary/40",
  ghost: "text-muted-foreground hover:bg-muted focus-visible:ring-primary/40",
  link: "text-primary underline-offset-4 hover:underline focus-visible:ring-transparent",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-8 text-base",
  icon: "h-10 w-10",
};

/**
 * Props for the Button component.
 *
 * @example
 * // Default primary button
 * <Button>Save Changes</Button>
 *
 * @example
 * // Destructive action
 * <Button variant="destructive">Delete Account</Button>
 *
 * @example
 * // Large CTA button
 * <Button size="lg" variant="default">Get Started</Button>
 *
 * @example
 * // Icon-only button
 * <Button size="icon" variant="ghost">
 *   <Settings className="h-4 w-4" />
 * </Button>
 *
 * @example
 * // As a link (using asChild)
 * <Button asChild>
 *   <Link href="/dashboard">Go to Dashboard</Link>
 * </Button>
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant. Defaults to "default". */
  variant?: ButtonVariant;
  /** Button size. Defaults to "default" (40px height). */
  size?: ButtonSize;
  /** When true, renders the child element with button styles instead of a button element. Useful for wrapping Link components. */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: cn(classes, child.props?.className),
        ...props,
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

/**
 * Helper function to get button classes for non-button elements.
 * Useful when you need button styling on a different element type.
 *
 * @example
 * // Apply button styles to a div
 * <div className={buttonVariants({ variant: "outline", size: "lg" })}>
 *   Custom Element
 * </div>
 *
 * @example
 * // Use with Link component
 * <Link href="/signup" className={buttonVariants({ variant: "default" })}>
 *   Sign Up
 * </Link>
 */
export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}
