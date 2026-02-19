"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import GameShell from "@/components/games/engine/GameShell";
import ByteChoiceGame from "@/components/games-v3/byte-choice/ByteChoiceGame";
import type { GameLanguage } from "@/lib/games/v3/data/byte-choice";

const VALID_LANGUAGES = new Set<GameLanguage>(["en", "es", "fr", "de", "it", "pt"]);

function getLanguage(input: string | null): GameLanguage {
  if (input && VALID_LANGUAGES.has(input as GameLanguage)) return input as GameLanguage;
  return "en";
}

function getMode(input: string | null): "daily" | "practice" {
  return input === "practice" ? "practice" : "daily";
}

function getChallengeCode(input: string | null): string | null {
  if (!input) return null;
  const normalized = input.trim().toUpperCase();
  return /^[A-Z0-9]{4,32}$/.test(normalized) ? normalized : null;
}

function getChallengeSeed(input: string | null): number | null {
  if (!input) return null;
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

function getChallengeDifficulty(input: string | null): number | null {
  if (!input) return null;
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return Math.trunc(parsed);
}

function getCefr(input: string | null): "A1" | "A2" | "B1" | "B2" | null {
  if (!input) return null;
  const normalized = input.trim().toUpperCase();
  if (normalized === "A1" || normalized === "A2" || normalized === "B1" || normalized === "B2") {
    return normalized;
  }
  return null;
}

export default function ByteChoicePage() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");
  const language = getLanguage(langParam);
  const hasUrlLang = langParam !== null && VALID_LANGUAGES.has(langParam as GameLanguage);
  const mode = getMode(searchParams.get("mode"));
  const challengeCode = getChallengeCode(searchParams.get("challenge"));
  const challengeSeed = getChallengeSeed(searchParams.get("seed"));
  const challengeDifficulty = getChallengeDifficulty(searchParams.get("di"));
  const cefr = getCefr(searchParams.get("cefr"));

  return (
    <GameShell
      gameName="Byte Choice"
      gameSlug="byte-choice"
      puzzleNumber={1}
      language={language}
      isComplete={false}
      isWon={false}
      mistakes={0}
    >
      <ByteChoiceGame
        language={language}
        mode={mode}
        cefr={cefr}
        challengeCode={challengeCode}
        challengeSeed={challengeSeed}
        challengeDifficulty={challengeDifficulty}
        hasUrlLang={hasUrlLang}
      />
    </GameShell>
  );
}
