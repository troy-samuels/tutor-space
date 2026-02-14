"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoVariant = "wordmark" | "icon" | "text";

const LOGO_ASSETS: Record<"wordmark" | "icon", { src: string; width: number; height: number }> = {
  wordmark: { src: "/brand/logo-wordmark.svg", width: 168, height: 36 },
  icon: { src: "/brand/logo-icon.svg", width: 40, height: 40 },
};

type LogoProps = {
  variant?: LogoVariant;
  href?: string;
  className?: string;
  priority?: boolean;
  alt?: string;
  onClick?: () => void;
};

/**
 * Shared brand logo component to keep visual identity consistent across pages.
 * variant="text" renders the name in Mansalva (the logo font).
 */
export function Logo({
  variant = "wordmark",
  href,
  className,
  priority = false,
  alt = "TutorLingua",
  onClick,
}: LogoProps) {
  const content =
    variant === "text" ? (
      <span
        className={cn(
          "text-2xl sm:text-3xl text-foreground select-none",
          className
        )}
        style={{ fontFamily: "var(--font-logo)" }}
      >
        TutorLingua
      </span>
    ) : (
      <Image
        src={LOGO_ASSETS[variant].src}
        alt={alt}
        width={LOGO_ASSETS[variant].width}
        height={LOGO_ASSETS[variant].height}
        className={cn("h-8 sm:h-9 w-auto", className)}
        priority={priority}
      />
    );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center"
        aria-label={alt}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return content;
}
