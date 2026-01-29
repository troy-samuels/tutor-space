import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { brandColors, typography, spacing } from "../styles/tokens";
import { fonts } from "../styles/fonts";
import { fadeIn, typewriter } from "../utils/animations";

interface BulletPointSceneProps {
  text: string;
  bulletNumber: number;
  startFrame?: number;
  icon?: "check" | "lightbulb" | "star" | "arrow";
}

// Icon components
const icons = {
  check: "✓",
  lightbulb: "💡",
  star: "⭐",
  arrow: "→",
};

// Assign icons based on bullet number for variety
const iconSequence: Array<"check" | "star" | "lightbulb"> = [
  "check",
  "star",
  "lightbulb",
];

/**
 * Animated bullet point scene with typewriter text
 * Duration: 5 seconds (150 frames at 30fps)
 */
export const BulletPointScene: React.FC<BulletPointSceneProps> = ({
  text,
  bulletNumber,
  startFrame = 0,
  icon,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation timings
  const iconStart = startFrame;
  const textStart = startFrame + 15;

  // Icon animation
  const iconScale = spring({
    frame: Math.max(0, frame - iconStart),
    fps,
    config: {
      damping: 100,
      mass: 0.5,
      stiffness: 200,
    },
  });

  const iconOpacity = fadeIn(frame, iconStart, 10);

  // Text typewriter effect
  const displayText = typewriter(text, frame, textStart, 1.5);

  // Progress indicator
  const progressWidth = interpolate(
    frame,
    [startFrame, startFrame + 150],
    [0, 100],
    {
      extrapolateRight: "clamp",
    }
  );

  // Select icon based on bullet number or explicit prop
  const selectedIcon = icon || iconSequence[(bulletNumber - 1) % iconSequence.length];
  const iconChar = icons[selectedIcon];

  // Icon background color based on type (using brand palette)
  const iconBgColor =
    selectedIcon === "check"
      ? brandColors.success  // Forest Green for checkmarks
      : selectedIcon === "star"
      ? brandColors.primary  // Burnt Orange for stars
      : brandColors.primary; // Burnt Orange for lightbulb/default

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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          width: "100%",
          maxWidth: 900,
        }}
      >
        {/* Bullet number indicator */}
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 24,
            fontWeight: 600,
            color: brandColors.textAccent,
            marginBottom: 16,
            opacity: fadeIn(frame, startFrame, 10),
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Tip #{bulletNumber}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: spacing.iconTextGap,
          }}
        >
          {/* Icon container */}
          <div
            style={{
              width: typography.bulletIconSize + 16,
              height: typography.bulletIconSize + 16,
              borderRadius: 16,
              background: iconBgColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: iconOpacity,
              transform: `scale(${iconScale})`,
              flexShrink: 0,
              boxShadow: `0 4px 20px ${iconBgColor}60`,
            }}
          >
            <span
              style={{
                fontSize: typography.bulletIconSize - 8,
                color: brandColors.text,
                lineHeight: 1,
              }}
            >
              {iconChar}
            </span>
          </div>

          {/* Text */}
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: typography.bulletSize,
              fontWeight: 600,
              color: brandColors.text,
              lineHeight: 1.4,
              margin: 0,
              flex: 1,
              textShadow: "0 2px 20px rgba(0,0,0,0.3)",
            }}
          >
            {displayText}
            {/* Cursor */}
            {displayText.length < text.length && (
              <span
                style={{
                  opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
                  color: brandColors.primary,
                }}
              >
                |
              </span>
            )}
          </p>
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: 40,
            width: "100%",
            height: 4,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressWidth}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${brandColors.primary}, ${brandColors.secondary})`,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
