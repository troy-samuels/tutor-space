"use client";

import * as React from "react";
import { shareResult } from "@/components/games/engine/share";
import ChallengeCTA from "./ChallengeCTA";

interface SharePanelProps {
  gameSlug: string;
  seed: number;
  mode: "daily" | "practice";
  score: number;
  streak: number;
  difficultyBand: number;
  locale: "en" | "es";
  shareWin: string;
  shareStumble: string;
  uiVersion: string;
  curveVersion: string;
}

export default function SharePanel(props: SharePanelProps) {
  const [copied, setCopied] = React.useState(false);
  const [challengeUrl, setChallengeUrl] = React.useState<string | null>(null);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCopyTimeout = React.useCallback(() => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => clearCopyTimeout, [clearCopyTimeout]);

  const shareText = React.useMemo(() => {
    const intro = props.score > 0 ? props.shareWin : props.shareStumble;
    const header = `${intro} #${props.gameSlug}`;
    const detail = `Score ${props.score} | Streak ${props.streak} | DI ${props.difficultyBand} | ${props.locale.toUpperCase()}`;
    const link = challengeUrl ?? "https://tutorlingua.co/games";
    return `${header}\n${detail}\n${link}`;
  }, [challengeUrl, props.difficultyBand, props.gameSlug, props.locale, props.score, props.shareStumble, props.shareWin, props.streak]);

  const handleShare = React.useCallback(async () => {
    await shareResult(shareText, "TutorLingua Challenge", setCopied, copyTimeoutRef);
  }, [shareText]);

  return (
    <section style={{ display: "grid", gap: 8 }}>
      <ChallengeCTA
        gameSlug={props.gameSlug}
        seed={props.seed}
        mode={props.mode}
        difficultyBand={props.difficultyBand}
        uiVersion={props.uiVersion}
        curveVersion={props.curveVersion}
        stumbleText={props.shareStumble}
        onCreated={(url) => setChallengeUrl(url)}
      />

      <button
        type="button"
        onPointerDown={handleShare}
        style={{
          minHeight: 48,
          borderRadius: 8,
          border: "1px solid #D9A441",
          background: "#D9A441",
          color: "#1E2B36",
          fontWeight: 800,
        }}
      >
        {copied ? "Shared" : challengeUrl ? "Share Challenge" : "Share Result"}
      </button>
    </section>
  );
}
