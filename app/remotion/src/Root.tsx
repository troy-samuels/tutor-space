import React from "react";
import { Composition } from "remotion";
import { KeyTakeawaysShort } from "./compositions/KeyTakeawaysShort";
import type { BlogVideoInput } from "./utils/blogToScenes";

// Cast component for Remotion's loose typing
const KeyTakeawaysShortComponent = KeyTakeawaysShort as unknown as React.FC<Record<string, unknown>>;

export const RemotionRoot: React.FC = () => {
  // Default props for preview in Remotion Studio
  const defaultProps: BlogVideoInput = {
    slug: "example-article",
    title: "How to Keep More of Your Tutoring Income",
    hook: "Are you losing $8,000/year to platform fees?",
    keyTakeaways: [
      "Platform fees eat 18-33% of every lesson",
      "Direct booking lets you keep 100% of income",
      "Students save money when you charge less",
    ],
    branding: {
      primaryColor: "#6366f1",
      secondaryColor: "#f59e0b",
      logo: "/logo.png",
      handle: "@tutorlingua",
    },
  };

  return (
    <>
      <Composition
        id="KeyTakeawaysShort"
        component={KeyTakeawaysShortComponent}
        durationInFrames={30 * 30} // 30 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps as unknown as Record<string, unknown>}
        calculateMetadata={({ props }) => {
          // Calculate duration based on content
          // Hook: 3s, Transition: 2s, 3 bullets: 5s each, CTA: 3s = 23s base
          // Add 0.5s per extra character beyond baseline for readability
          const baseDuration = 23 * 30; // 23 seconds in frames
          const takeaways = (props as unknown as BlogVideoInput).keyTakeaways || [];
          const contentBonus = Math.min(
            takeaways.reduce((acc: number, t: string) => acc + Math.max(0, t.length - 40), 0) * 0.5,
            15 * 30 // Cap at 15 extra seconds
          );
          return {
            durationInFrames: Math.ceil(baseDuration + contentBonus),
          };
        }}
      />
    </>
  );
};
