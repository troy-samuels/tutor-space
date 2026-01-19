/**
 * usePopoverClose Hook
 *
 * Handles click-outside detection and escape key handling for popovers.
 * Extracted from slot-quick-actions.tsx:47-72 pattern.
 */

import { useCallback, useEffect, useRef } from "react";

interface UsePopoverCloseOptions {
  /** Whether the popover is currently open */
  isOpen: boolean;
  /** Callback when popover should close */
  onClose: () => void;
  /** Disable click-outside detection */
  disableClickOutside?: boolean;
  /** Disable escape key detection */
  disableEscapeKey?: boolean;
  /** Delay in ms before enabling click-outside (prevents immediate close on open) */
  clickOutsideDelay?: number;
}

interface UsePopoverCloseReturn {
  /** Ref to attach to the popover container */
  popoverRef: React.RefObject<HTMLDivElement | null>;
  /** Manual close handler */
  close: () => void;
}

const DEFAULT_CLICK_OUTSIDE_DELAY = 100;

export function usePopoverClose({
  isOpen,
  onClose,
  disableClickOutside = false,
  disableEscapeKey = false,
  clickOutsideDelay = DEFAULT_CLICK_OUTSIDE_DELAY,
}: UsePopoverCloseOptions): UsePopoverCloseReturn {
  const popoverRef = useRef<HTMLDivElement>(null);
  const isEnabledRef = useRef(false);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || disableEscapeKey) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, disableEscapeKey, close]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen || disableClickOutside) {
      isEnabledRef.current = false;
      return;
    }

    // Delay enabling click-outside to prevent immediate close
    const enableTimer = setTimeout(() => {
      isEnabledRef.current = true;
    }, clickOutsideDelay);

    const handleClickOutside = (event: MouseEvent) => {
      if (!isEnabledRef.current) return;

      const target = event.target as Node;

      // Check if click is outside the popover
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        close();
      }
    };

    // Use mousedown for more responsive closing
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearTimeout(enableTimer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, disableClickOutside, clickOutsideDelay, close]);

  // Reset enabled state when closed
  useEffect(() => {
    if (!isOpen) {
      isEnabledRef.current = false;
    }
  }, [isOpen]);

  return {
    popoverRef,
    close,
  };
}

/**
 * Combined hook for both position and close handling
 */
export function usePopoverBehavior({
  isOpen,
  onClose,
  disableClickOutside,
  disableEscapeKey,
  clickOutsideDelay,
}: UsePopoverCloseOptions) {
  const { popoverRef, close } = usePopoverClose({
    isOpen,
    onClose,
    disableClickOutside,
    disableEscapeKey,
    clickOutsideDelay,
  });

  return {
    popoverRef,
    close,
    isOpen,
  };
}
