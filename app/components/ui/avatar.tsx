"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarContextValue = {
  hasImage: boolean;
  imageError: boolean;
  setImageError: (value: boolean) => void;
};

const AvatarContext = React.createContext<AvatarContextValue | null>(null);

/**
 * Avatar component system for displaying user profile images with fallbacks.
 *
 * @example
 * // Avatar with image
 * <Avatar>
 *   <AvatarImage src="/user.jpg" alt="John Doe" />
 *   <AvatarFallback>JD</AvatarFallback>
 * </Avatar>
 *
 * @example
 * // Avatar with fallback only (no image)
 * <Avatar>
 *   <AvatarFallback>AB</AvatarFallback>
 * </Avatar>
 *
 * @example
 * // Custom sized avatar
 * <Avatar className="h-16 w-16">
 *   <AvatarImage src="/user.jpg" alt="User" />
 *   <AvatarFallback>U</AvatarFallback>
 * </Avatar>
 */
export type AvatarProps = React.HTMLAttributes<HTMLDivElement>;

export function Avatar({ className, children, ...props }: AvatarProps) {
  const imageSrc = React.useMemo(() => {
    let src: string | undefined;
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        return;
      }
      if (child.type !== AvatarImage) {
        return;
      }
      const childProps = child.props as AvatarImageProps;
      if (childProps.src) {
        src = childProps.src;
      }
    });
    return src ?? null;
  }, [children]);
  const hasImage = Boolean(imageSrc);
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [imageSrc]);

  return (
    <AvatarContext.Provider value={{ hasImage, imageError, setImageError }}>
      <div
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/10",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  );
}

/**
 * Avatar image component. Automatically hides on error.
 */
export type AvatarImageProps = {
  /** Image source URL */
  src?: string;
  /** Alt text for accessibility */
  alt: string;
  /** Additional CSS classes */
  className?: string;
};

export function AvatarImage({ src, alt, className }: AvatarImageProps) {
  const context = React.useContext(AvatarContext);
  const setImageError = context?.setImageError;
  const [localError, setLocalError] = React.useState(false);

  React.useEffect(() => {
    setLocalError(false);
    setImageError?.(false);
  }, [src, setImageError]);

  if (!src || localError || context?.imageError) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="40px"
      className={cn("object-cover", className)}
      onError={() => {
        setLocalError(true);
        setImageError?.(true);
      }}
    />
  );
}

/**
 * Avatar fallback content. Shown when image fails to load or is not provided.
 * Typically displays user initials.
 */
export type AvatarFallbackProps = React.HTMLAttributes<HTMLDivElement>;

export function AvatarFallback({
  className,
  children,
  ...props
}: AvatarFallbackProps) {
  const context = React.useContext(AvatarContext);
  const shouldRender = !context || !context.hasImage || context.imageError;

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cn("absolute inset-0 flex items-center justify-center font-semibold text-primary text-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}
