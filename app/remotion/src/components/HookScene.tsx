import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { brandColors, typography, spacing } from "../styles/tokens";
import { fonts } from "../styles/fonts";
import { fadeIn, slideUp } from "../utils/animations";

interface HookSceneProps {
  text: string;
  startFrame?: number;
}

/**
 * Opening hook scene with animated question/statement
 * Duration: 3 seconds (90 frames at 30fps)
 */
export const HookScene: React.FC<HookSceneProps> = ({
  text,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation timings
  const fadeInStart = startFrame;
  const scaleStart = startFrame + 5;

  // Fade in opacity
  const opacity = fadeIn(frame, fadeInStart, 20);

  // Spring scale for emphasis
  const scale = spring({
    frame: Math.max(0, frame - scaleStart),
    fps,
    config: {
      damping: 200,
      mass: 0.8,
      stiffness: 150,
    },
  });

  // Slight Y offset that settles
  const translateY = slideUp(frame, fadeInStart, 40, 25);

  // Subtle glow animation
  const glowOpacity = interpolate(
    frame,
    [fadeInStart, fadeInStart + 30, fadeInStart + 60],
    [0, 0.8, 0.6],
    {
      extrapolateRight: "clamp",
    }
  );

  // Split text into lines for better layout on mobile-first format
  const words = text.split(" ");
  const midpoint = Math.ceil(words.length / 2);
  const lines =
    words.length > 6
      ? [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")]
      : [text];

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
          transform: `scale(${0.8 + scale * 0.2}) translateY(${translateY}px)`,
          textAlign: "center",
          maxWidth: "90%",
        }}
      >
        {/* Glow effect behind text */}
        <div
          style={{
            position: "absolute",
            inset: -40,
            background: `radial-gradient(ellipse at center, ${brandColors.primary}40 0%, transparent 70%)`,
            opacity: glowOpacity,
            filter: "blur(30px)",
          }}
        />

        {/* Main text */}
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: typography.hookSize,
            fontWeight: 400, // Mansalva only has regular weight
            color: brandColors.text,
            lineHeight: 1.4, // Slightly looser for handwritten feel
            letterSpacing: "0.01em",
            textShadow: `0 4px 30px rgba(0,0,0,0.5)`,
            margin: 0,
            position: "relative",
          }}
        >
          {lines.map((line, i) => (
            <span
              key={i}
              style={{
                display: "block",
                marginBottom: i < lines.length - 1 ? 16 : 0,
              }}
            >
              {line}
            </span>
          ))}
        </h1>

        {/* Accent underline */}
        <div
          style={{
            width: interpolate(
              frame,
              [fadeInStart + 15, fadeInStart + 35],
              [0, 200],
              { extrapolateRight: "clamp" }
            ),
            height: 4,
            background: `linear-gradient(90deg, ${brandColors.secondary}, ${brandColors.primary})`,
            borderRadius: 2,
            margin: "24px auto 0",
            opacity: opacity,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
