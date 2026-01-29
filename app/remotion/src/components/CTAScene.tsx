import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, Img, staticFile } from "remotion";
import { brandColors, typography, spacing } from "../styles/tokens";
import { fonts } from "../styles/fonts";
import { fadeIn } from "../utils/animations";

interface CTASceneProps {
  handle: string;
  logoSrc?: string;
  startFrame?: number;
}

/**
 * Call-to-action scene with logo and follow prompt
 * Duration: 3 seconds (90 frames at 30fps)
 */
export const CTAScene: React.FC<CTASceneProps> = ({
  handle,
  logoSrc,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation timings
  const logoStart = startFrame;
  const textStart = startFrame + 15;

  // Logo animation
  const logoScale = spring({
    frame: Math.max(0, frame - logoStart),
    fps,
    config: {
      damping: 100,
      mass: 0.6,
      stiffness: 180,
    },
  });

  const logoOpacity = fadeIn(frame, logoStart, 15);

  // Text animation
  const textOpacity = fadeIn(frame, textStart, 15);


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
          gap: 32,
        }}
      >
        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        >
          {logoSrc ? (
            <Img
              src={staticFile(logoSrc.replace(/^\//, ""))}
              style={{
                width: 200,
                height: 200,
                objectFit: "contain",
              }}
            />
          ) : (
            // Fallback logo placeholder
            <div
              style={{
                width: 200,
                height: 200,
                borderRadius: 32,
                background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 72,
                fontWeight: 700,
                color: brandColors.text,
                fontFamily: fonts.body,
                boxShadow: `0 8px 40px ${brandColors.primary}60`,
              }}
            >
              TL
            </div>
          )}
        </div>

        {/* Main CTA text */}
        <div
          style={{
            opacity: textOpacity,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: fonts.body,
              fontSize: typography.ctaSize,
              fontWeight: 700,
              color: brandColors.text,
              margin: 0,
              marginBottom: 8,
              textShadow: "0 2px 20px rgba(0,0,0,0.4)",
            }}
          >
            Follow for more tips
          </h2>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: typography.handleSize,
              fontWeight: 500,
              color: brandColors.textMuted,
              margin: 0,
            }}
          >
            {handle}
          </p>
        </div>

        {/* Website URL */}
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: 20,
            fontWeight: 400,
            color: brandColors.textMuted,
            margin: 0,
            marginTop: 16,
            opacity: textOpacity,
          }}
        >
          tutorlingua.co/blog
        </p>
      </div>
    </AbsoluteFill>
  );
};
