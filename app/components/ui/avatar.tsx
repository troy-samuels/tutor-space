"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type AvatarProps = React.HTMLAttributes<HTMLDivElement>;

export function Avatar({ className, children, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type AvatarImageProps = {
  src?: string;
  alt: string;
  className?: string;
};

export function AvatarImage({ src, alt, className }: AvatarImageProps) {
  const [error, setError] = React.useState(false);

  if (!src || error) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="40px"
      className={cn("object-cover", className)}
      onError={() => setError(true)}
    />
  );
}

export type AvatarFallbackProps = React.HTMLAttributes<HTMLDivElement>;

export function AvatarFallback({
  className,
  children,
  ...props
}: AvatarFallbackProps) {
  return (
    <div
      className={cn("absolute inset-0 flex items-center justify-center font-semibold text-primary text-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}
