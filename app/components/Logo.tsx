import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoVariant = "wordmark" | "icon";

const LOGO_ASSETS: Record<LogoVariant, { src: string; width: number; height: number }> = {
  wordmark: { src: "/brand/logo-wordmark.svg", width: 160, height: 48 },
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
 */
export function Logo({
  variant = "wordmark",
  href,
  className,
  priority = false,
  alt = "TutorLingua",
  onClick,
}: LogoProps) {
  const asset = LOGO_ASSETS[variant];

  const image = (
    <Image
      src={asset.src}
      alt={alt}
      width={asset.width}
      height={asset.height}
      className={cn("h-auto w-auto", className)}
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
        {image}
      </Link>
    );
  }

  return image;
}
