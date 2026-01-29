import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { brandColors } from "../styles/tokens";

interface BackgroundProps {
  primaryColor?: string;
  secondaryColor?: string;
  animated?: boolean;
}

/**
 * Animated gradient background with subtle movement
 */
export const Background: React.FC<BackgroundProps> = ({
  primaryColor = brandColors.backgroundGradientStart,
  secondaryColor = brandColors.backgroundGradientEnd,
  animated = true,
}) => {
  const frame = useCurrentFrame();

  // Subtle gradient angle animation
  const gradientAngle = animated
    ? interpolate(frame, [0, 900], [135, 145], {
        extrapolateRight: "clamp",
      })
    : 140;

  // Subtle scale animation for the accent orb
  const orbScale = animated
    ? interpolate(frame, [0, 450, 900], [1, 1.1, 1], {
        extrapolateRight: "clamp",
      })
    : 1;

  const orbOpacity = animated
    ? interpolate(frame, [0, 450, 900], [0.3, 0.4, 0.3], {
        extrapolateRight: "clamp",
      })
    : 0.35;

  return (
    <AbsoluteFill>
      {/* Base gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${gradientAngle}deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      />

      {/* Accent orb - top right (Burnt Orange) */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${brandColors.primary}50 0%, transparent 70%)`,
          opacity: orbOpacity,
          transform: `scale(${orbScale})`,
        }}
      />

      {/* Secondary orb - bottom left (Forest Green accent) */}
      <div
        style={{
          position: "absolute",
          bottom: -300,
          left: -200,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${brandColors.accent || brandColors.secondary}35 0%, transparent 70%)`,
          opacity: orbOpacity * 0.7,
          transform: `scale(${orbScale})`,
        }}
      />

      {/* Subtle noise overlay for texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          mixBlendMode: "overlay",
        }}
      />

      {/* Vignette effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
