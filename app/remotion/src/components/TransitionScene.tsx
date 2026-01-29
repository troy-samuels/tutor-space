import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { brandColors, typography, spacing } from "../styles/tokens";
import { fadeIn, slideUp } from "../utils/animations";

interface TransitionSceneProps {
  text?: string;
  startFrame?: number;
}

/**
 * Transition scene with "Here's what you need to know..." text
 * Duration: 2 seconds (60 frames at 30fps)
 */
export const TransitionScene: React.FC<TransitionSceneProps> = ({
  text = "Here's what you need to know...",
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();

  // Animation timings
  const opacity = fadeIn(frame, startFrame, 15);
  const translateY = slideUp(frame, startFrame, 60, 20);

  // Dots animation (typewriter effect)
  const dotsCount = Math.min(
    3,
    Math.floor(Math.max(0, frame - startFrame - 20) / 10)
  );
  const displayText = text.endsWith("...")
    ? text.slice(0, -3) + ".".repeat(dotsCount)
    : text;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.screenPadding,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          textAlign: "center",
        }}
      >
        {/* Icon - lightbulb or similar */}
        <div
          style={{
            fontSize: 48,
            marginBottom: 24,
            filter: "drop-shadow(0 4px 20px rgba(251, 191, 36, 0.4))",
          }}
        >
          💡
        </div>

        <p
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.transitionSize,
            fontWeight: 500,
            color: brandColors.textMuted,
            lineHeight: typography.lineHeight,
            letterSpacing: "0.02em",
            margin: 0,
            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
          }}
        >
          {displayText}
        </p>
      </div>
    </AbsoluteFill>
  );
};
