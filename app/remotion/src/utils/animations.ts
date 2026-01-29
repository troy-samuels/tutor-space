import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { animations } from "../styles/tokens";

/**
 * Fade in animation
 * @param frame - Current frame
 * @param startFrame - Frame to start animation
 * @param duration - Duration in frames (default: 15 = 0.5s at 30fps)
 */
export function fadeIn(
  frame: number,
  startFrame: number,
  duration: number = animations.fadeInDuration
): number {
  return interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/**
 * Fade out animation
 */
export function fadeOut(
  frame: number,
  startFrame: number,
  duration: number = animations.fadeInDuration
): number {
  return interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/**
 * Slide up animation
 * @param frame - Current frame
 * @param startFrame - Frame to start animation
 * @param distance - Distance to slide in pixels (default: 80)
 * @param duration - Duration in frames
 */
export function slideUp(
  frame: number,
  startFrame: number,
  distance: number = animations.slideDistance,
  duration: number = animations.fadeInDuration
): number {
  const progress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  return distance * (1 - progress);
}

/**
 * Slide down animation (for exit)
 */
export function slideDown(
  frame: number,
  startFrame: number,
  distance: number = animations.slideDistance,
  duration: number = animations.fadeInDuration
): number {
  const progress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  return -distance * progress;
}

/**
 * Typewriter effect - returns how many characters to show
 * @param text - Full text to type
 * @param frame - Current frame
 * @param startFrame - Frame to start typing
 * @param charsPerFrame - Characters per frame (default: 2)
 */
export function typewriter(
  text: string,
  frame: number,
  startFrame: number,
  charsPerFrame: number = animations.typewriterSpeed
): string {
  if (frame < startFrame) return "";

  const elapsed = frame - startFrame;
  const charsToShow = Math.floor(elapsed * charsPerFrame);

  return text.slice(0, Math.min(charsToShow, text.length));
}

/**
 * Spring scale animation (bounce effect)
 * @param frame - Current frame
 * @param startFrame - Frame to start animation
 * @param fps - Frames per second
 */
export function scaleSpring(
  frame: number,
  startFrame: number,
  fps: number
): number {
  if (frame < startFrame) return 0;

  return spring({
    frame: frame - startFrame,
    fps,
    config: animations.springConfig,
  });
}

/**
 * Hook for animated opacity with fade in
 */
export function useAnimatedOpacity(
  startFrame: number,
  duration?: number
): number {
  const frame = useCurrentFrame();
  return fadeIn(frame, startFrame, duration);
}

/**
 * Hook for animated Y position with slide up
 */
export function useAnimatedSlideUp(
  startFrame: number,
  distance?: number,
  duration?: number
): number {
  const frame = useCurrentFrame();
  return slideUp(frame, startFrame, distance, duration);
}

/**
 * Hook for spring scale animation
 */
export function useSpringScale(startFrame: number): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return scaleSpring(frame, startFrame, fps);
}

/**
 * Easing function for smooth transitions
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function for bouncy effect
 */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
