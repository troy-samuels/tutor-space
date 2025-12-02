"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

import { cn } from "@/lib/utils";

export type AvatarProps = React.HTMLAttributes<HTMLDivElement>;

export function Avatar({ className, children, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-sm font-medium text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type AvatarImageProps = Omit<ImageProps, "fill"> & {
  className?: string;
};

export function AvatarImage({
  className,
  alt = "",
  sizes = "2.5rem",
  ...props
}: AvatarImageProps) {
  return (
    <Image
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      sizes={sizes}
      fill
      {...props}
    />
  );
}

export type AvatarFallbackProps = React.HTMLAttributes<HTMLSpanElement>;

export function AvatarFallback({
  className,
  children,
  ...props
}: AvatarFallbackProps) {
  return (
    <span
      className={cn("flex h-full w-full items-center justify-center", className)}
      {...props}
    >
      {children}
    </span>
  );
}
