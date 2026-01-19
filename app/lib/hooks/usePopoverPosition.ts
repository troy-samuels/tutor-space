/**
 * usePopoverPosition Hook
 *
 * Handles viewport boundary detection and auto-repositioning for popovers.
 * Ensures popovers stay within the visible viewport.
 *
 * Extracted from slot-quick-actions.tsx:75-92 pattern.
 */

import { useState, useCallback, useEffect, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

interface PopoverDimensions {
  width: number;
  height: number;
}

interface UsePopoverPositionOptions {
  /** Padding from viewport edges in pixels */
  padding?: number;
  /** Popover dimensions for boundary calculation */
  dimensions?: PopoverDimensions;
  /** Offset from click position */
  offset?: { x: number; y: number };
  /** Provide an external ref to share between hooks */
  popoverRef?: React.RefObject<HTMLDivElement | null>;
}

interface UsePopoverPositionReturn {
  /** Adjusted position for rendering */
  position: Position;
  /** Set the raw click position (will be adjusted automatically) */
  setClickPosition: (pos: Position) => void;
  /** Reference to attach to popover for dimension measurement */
  popoverRef: React.RefObject<HTMLDivElement | null>;
  /** Whether popover was adjusted to fit viewport */
  wasAdjusted: boolean;
  /** Direction adjustments made */
  adjustments: {
    horizontal: "left" | "right" | "none";
    vertical: "up" | "down" | "none";
  };
}

const DEFAULT_PADDING = 16;
const DEFAULT_OFFSET = { x: 0, y: 8 };
const DEFAULT_DIMENSIONS = { width: 200, height: 150 };

export function usePopoverPosition(
  options: UsePopoverPositionOptions = {}
): UsePopoverPositionReturn {
  const {
    padding = DEFAULT_PADDING,
    dimensions: initialDimensions = DEFAULT_DIMENSIONS,
    offset = DEFAULT_OFFSET,
    popoverRef: providedRef,
  } = options;

  const popoverRef = providedRef ?? useRef<HTMLDivElement>(null);
  const [rawPosition, setRawPosition] = useState<Position>({ x: 0, y: 0 });
  const [adjustedPosition, setAdjustedPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [wasAdjusted, setWasAdjusted] = useState(false);
  const [adjustments, setAdjustments] = useState<{
    horizontal: "left" | "right" | "none";
    vertical: "up" | "down" | "none";
  }>({
    horizontal: "none",
    vertical: "none",
  });

  const calculatePosition = useCallback(() => {
    // Get actual dimensions from popover element or use defaults
    const dimensions = popoverRef.current
      ? {
          width: popoverRef.current.offsetWidth || initialDimensions.width,
          height: popoverRef.current.offsetHeight || initialDimensions.height,
        }
      : initialDimensions;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Start with raw position plus offset
    let x = rawPosition.x + offset.x;
    let y = rawPosition.y + offset.y;

    let horizontalAdjustment: "left" | "right" | "none" = "none";
    let verticalAdjustment: "up" | "down" | "none" = "none";
    let adjusted = false;

    // Check right boundary
    if (x + dimensions.width > viewportWidth - padding) {
      x = rawPosition.x - dimensions.width - offset.x;
      horizontalAdjustment = "left";
      adjusted = true;
    }

    // Check left boundary
    if (x < padding) {
      x = padding;
      horizontalAdjustment = "right";
      adjusted = true;
    }

    // Check bottom boundary
    if (y + dimensions.height > viewportHeight - padding) {
      y = rawPosition.y - dimensions.height - offset.y;
      verticalAdjustment = "up";
      adjusted = true;
    }

    // Check top boundary
    if (y < padding) {
      y = padding;
      verticalAdjustment = "down";
      adjusted = true;
    }

    setAdjustedPosition({ x, y });
    setWasAdjusted(adjusted);
    setAdjustments({
      horizontal: horizontalAdjustment,
      vertical: verticalAdjustment,
    });
  }, [rawPosition, padding, offset, initialDimensions]);

  // Recalculate on position change
  useEffect(() => {
    calculatePosition();
  }, [calculatePosition]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      calculatePosition();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculatePosition]);

  // Recalculate when popover mounts/dimensions change
  useEffect(() => {
    if (popoverRef.current) {
      const observer = new ResizeObserver(() => {
        calculatePosition();
      });
      observer.observe(popoverRef.current);
      return () => observer.disconnect();
    }
  }, [calculatePosition]);

  const setClickPosition = useCallback((pos: Position) => {
    setRawPosition(pos);
  }, []);

  return {
    position: adjustedPosition,
    setClickPosition,
    popoverRef,
    wasAdjusted,
    adjustments,
  };
}
