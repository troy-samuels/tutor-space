import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { HookScene } from "../components/HookScene";
import { TransitionScene } from "../components/TransitionScene";
import { BulletPointScene } from "../components/BulletPointScene";
import { CTAScene } from "../components/CTAScene";
import type { BlogVideoInput } from "../utils/blogToScenes";

/**
 * Scene timing configuration (in seconds)
 */
const SCENE_TIMING = {
  hook: 4, // 120 frames (+1s for readability)
  transition: 2, // 60 frames (keep)
  bulletPoint: 6, // 180 frames each (+1s for readability)
  cta: 4, // 120 frames (+1s for readability)
};

/**
 * Main composition for Key Takeaways short-form video
 *
 * Structure:
 * 1. Hook (3s) - Opening question/statement
 * 2. Transition (2s) - "Here's what you need to know..."
 * 3. Bullet Point 1 (5s) - First key takeaway
 * 4. Bullet Point 2 (5s) - Second key takeaway
 * 5. Bullet Point 3 (5s) - Third key takeaway
 * 6. CTA (3s) - Follow prompt with logo
 *
 * Total: ~23 seconds base
 */
export const KeyTakeawaysShort: React.FC<BlogVideoInput> = ({
  title,
  hook,
  keyTakeaways,
  branding,
}) => {
  const { fps } = useVideoConfig();

  // Convert seconds to frames
  const toFrames = (seconds: number) => Math.round(seconds * fps);

  // Calculate scene start frames
  const hookDuration = toFrames(SCENE_TIMING.hook);
  const transitionDuration = toFrames(SCENE_TIMING.transition);
  const bulletDuration = toFrames(SCENE_TIMING.bulletPoint);
  const ctaDuration = toFrames(SCENE_TIMING.cta);

  // Scene start times
  const hookStart = 0;
  const transitionStart = hookStart + hookDuration;
  const bullet1Start = transitionStart + transitionDuration;
  const bullet2Start = bullet1Start + bulletDuration;
  const bullet3Start = bullet2Start + bulletDuration;
  const ctaStart = bullet3Start + bulletDuration;

  // Ensure we have exactly 3 takeaways
  const takeaways = [
    keyTakeaways[0] || "Learn expert strategies",
    keyTakeaways[1] || "Save time and money",
    keyTakeaways[2] || "Grow your business",
  ];

  return (
    <AbsoluteFill>
      {/* Background - always visible */}
      <Background
        primaryColor={branding.primaryColor}
        animated={true}
      />

      {/* Scene 1: Hook */}
      <Sequence from={hookStart} durationInFrames={hookDuration + 15}>
        <HookScene text={hook} startFrame={0} />
      </Sequence>

      {/* Scene 2: Transition */}
      <Sequence from={transitionStart} durationInFrames={transitionDuration + 15}>
        <TransitionScene startFrame={0} />
      </Sequence>

      {/* Scene 3: Bullet Point 1 */}
      <Sequence from={bullet1Start} durationInFrames={bulletDuration + 15}>
        <BulletPointScene
          text={takeaways[0]}
          bulletNumber={1}
          startFrame={0}
        />
      </Sequence>

      {/* Scene 4: Bullet Point 2 */}
      <Sequence from={bullet2Start} durationInFrames={bulletDuration + 15}>
        <BulletPointScene
          text={takeaways[1]}
          bulletNumber={2}
          startFrame={0}
        />
      </Sequence>

      {/* Scene 5: Bullet Point 3 */}
      <Sequence from={bullet3Start} durationInFrames={bulletDuration + 15}>
        <BulletPointScene
          text={takeaways[2]}
          bulletNumber={3}
          startFrame={0}
        />
      </Sequence>

      {/* Scene 6: CTA */}
      <Sequence from={ctaStart} durationInFrames={ctaDuration + 30}>
        <CTAScene
          handle={branding.handle}
          logoSrc={branding.logo}
          startFrame={0}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
