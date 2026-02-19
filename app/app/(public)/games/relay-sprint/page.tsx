"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import GameShell from "@/components/games/engine/GameShell";
import RelaySprintGame from "@/components/games-v3/relay-sprint/RelaySprintGame";

function getLanguage(input: string | null): "en" | "es" {
  return input === "es" ? "es" : "en";
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

export default function RelaySprintPage() {
  const searchParams = useSearchParams();
  const language = getLanguage(searchParams.get("lang"));
  const mode = getMode(searchParams.get("mode"));
  const challengeCode = getChallengeCode(searchParams.get("challenge"));
  const challengeSeed = getChallengeSeed(searchParams.get("seed"));
  const challengeDifficulty = getChallengeDifficulty(searchParams.get("di"));

  return (
    <GameShell
      gameName="Relay Sprint"
      gameSlug="relay-sprint"
      puzzleNumber={1}
      language={language}
      isComplete={false}
      isWon={false}
      mistakes={0}
    >
      <RelaySprintGame
        language={language}
        mode={mode}
        challengeCode={challengeCode}
        challengeSeed={challengeSeed}
        challengeDifficulty={challengeDifficulty}
      />
    </GameShell>
  );
}
