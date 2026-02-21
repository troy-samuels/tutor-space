"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import GameShell from "@/components/games/engine/GameShell";
import LinguaWordleGame from "@/components/games-v3/lingua-wordle/LinguaWordleGame";
import type { CefrTier } from "@/lib/games/v3/data/lingua-wordle";

function getLanguage(input: string | null): string {
  const valid = new Set(["es", "fr", "de", "it", "pt"]);
  return input && valid.has(input) ? input : "es";
}

function getMode(input: string | null): "daily" | "practice" {
  return input === "practice" ? "practice" : "daily";
}

function getCefr(input: string | null): CefrTier | null {
  if (!input) return null;
  const normalised = input.trim().toUpperCase();
  if (["A1", "A2", "B1", "B2"].includes(normalised)) return normalised as CefrTier;
  return null;
}

function getChallengeSeed(input: string | null): number | null {
  if (!input) return null;
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

export default function LinguaWordlePage() {
  const searchParams = useSearchParams();
  const language = getLanguage(searchParams.get("lang"));
  const mode = getMode(searchParams.get("mode"));
  const cefr = getCefr(searchParams.get("cefr"));
  const challengeSeed = getChallengeSeed(searchParams.get("seed"));

  return (
    <GameShell
      gameName="Lingua Wordle"
      gameSlug="lingua-wordle"
      puzzleNumber={1}
      language={language}
      isComplete={false}
      isWon={false}
      mistakes={0}
    >
      <LinguaWordleGame
        language={language}
        mode={mode}
        cefr={cefr}
        challengeSeed={challengeSeed}
      />
    </GameShell>
  );
}
