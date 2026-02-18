import { getDailySeed, getTodayUTC, seededShuffle } from "@/lib/games/daily-seed";
import { getFalseFriendsForLevel } from "@/lib/games/data/false-friends";
import { PROMPTS_EN } from "./puzzles-en.ts";
import { PROMPTS_ES } from "./puzzles-es.ts";
import { PROMPTS_FR } from "./puzzles-fr.ts";
import { PROMPTS_DE } from "./puzzles-de.ts";
import type {
  NeonInterceptPuzzle,
  NeonInterceptPromptDefinition,
  NeonInterceptWave,
} from "./types.ts";
import type { CefrLevel } from "@/lib/games/cefr";

const GAME_SLUG = "neon-intercept";
const GAME_LAUNCH_DATE = "2026-02-18";
const TARGET_WAVES = 60;

const BASE_PROMPTS: Record<string, NeonInterceptPromptDefinition[]> = {
  en: PROMPTS_EN,
  es: PROMPTS_ES,
  fr: PROMPTS_FR,
  de: PROMPTS_DE,
};

export const SUPPORTED_GAME_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
] as const;

const FALSE_FRIEND_CLUE_BY_LANG: Record<string, string> = {
  en: "False friend: \"{word}\" really means...",
  es: "Falso amigo: \"{word}\" significa...",
  fr: "Faux ami : \"{word}\" veut dire...",
  de: "Falscher Freund: \"{word}\" bedeutet...",
};

function getPuzzleNumberForDate(date: string, launchDate: string = GAME_LAUNCH_DATE): number {
  const launch = new Date(`${launchDate}T00:00:00.000Z`);
  const current = new Date(`${date}T00:00:00.000Z`);
  const diffMs = current.getTime() - launch.getTime();
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

function normaliseCefrLevel(level: string): CefrLevel {
  if (level === "A1" || level === "A2" || level === "B1" || level === "B2") {
    return level;
  }
  return "B2";
}

function buildFalseFriendPrompts(language: string): NeonInterceptPromptDefinition[] {
  const falseFriends = getFalseFriendsForLevel(language, "B1").slice(0, 12);
  if (falseFriends.length < 3) return [];

  const fallbackMeanings = falseFriends.map((ff) => ff.actualMeaning);

  return falseFriends.map((ff, index) => {
    const altMeaningRaw = fallbackMeanings[(index + 3) % fallbackMeanings.length] || ff.looksLike;
    const altMeaning = altMeaningRaw === ff.actualMeaning
      ? fallbackMeanings[(index + 4) % fallbackMeanings.length] || ff.looksLike
      : altMeaningRaw;

    return {
      id: `ff-${ff.language}-${ff.word}-${index}`,
      clue: (FALSE_FRIEND_CLUE_BY_LANG[ff.language] ?? FALSE_FRIEND_CLUE_BY_LANG.en).replace("{word}", ff.word),
      correct: ff.actualMeaning,
      distractors: [ff.looksLike, altMeaning],
      cefrLevel: normaliseCefrLevel(ff.cefrLevel),
      kind: "false-friend",
      falseFriendWord: ff.word,
      explanation: `"${ff.word}" looks like "${ff.looksLike}" but means "${ff.actualMeaning}".`,
    };
  });
}

function buildPromptPool(language: string): {
  basePrompts: NeonInterceptPromptDefinition[];
  fullPool: NeonInterceptPromptDefinition[];
} {
  const basePrompts = BASE_PROMPTS[language] ?? BASE_PROMPTS.en;
  if (language === "en") {
    return { basePrompts, fullPool: basePrompts };
  }
  const falseFriendPrompts = buildFalseFriendPrompts(language);
  return { basePrompts, fullPool: [...basePrompts, ...falseFriendPrompts] };
}

function withOptionsShuffled(
  def: NeonInterceptPromptDefinition,
  seed: number
): NeonInterceptWave {
  const shuffled = seededShuffle([def.correct, ...def.distractors], seed) as string[];
  const correctIndex = shuffled.indexOf(def.correct);
  const safeCorrectIndex: 0 | 1 | 2 = correctIndex === 0 || correctIndex === 1 || correctIndex === 2
    ? correctIndex
    : 0;

  return {
    id: def.id,
    clue: def.clue,
    options: [shuffled[0], shuffled[1], shuffled[2]],
    correctIndex: safeCorrectIndex,
    cefrLevel: def.cefrLevel,
    kind: def.kind ?? "core",
    falseFriendWord: def.falseFriendWord,
    explanation: def.explanation,
  };
}

function pickNonRepeatingPrompt(
  pool: NeonInterceptPromptDefinition[],
  index: number,
  previousId: string | null
): NeonInterceptPromptDefinition {
  let candidate = pool[index % pool.length];
  if (pool.length > 1 && candidate.id === previousId) {
    candidate = pool[(index + 1) % pool.length];
  }
  return candidate;
}

export function getPuzzleForDate(language: string, date: string): NeonInterceptPuzzle | null {
  const seed = getDailySeed(GAME_SLUG, language, date);
  const { basePrompts, fullPool } = buildPromptPool(language);
  if (fullPool.length === 0 || basePrompts.length === 0) return null;

  const rotated = seededShuffle(fullPool, seed);
  const rotatedBase = seededShuffle(basePrompts, seed + 77);
  const waves: NeonInterceptWave[] = [];
  let previousId: string | null = null;

  for (let i = 0; i < TARGET_WAVES; i++) {
    const shouldBoss = i > 0 && i % 10 === 9;
    const source = shouldBoss ? rotatedBase : rotated;
    const picked = pickNonRepeatingPrompt(source, i, previousId);
    const wave = withOptionsShuffled(picked, seed + i * 1031);

    if (shouldBoss) {
      wave.kind = "boss";
      wave.clue = `BOSS: ${wave.clue}`;
    }

    wave.id = `${wave.id}-${i + 1}`;
    waves.push(wave);
    previousId = picked.id;
  }

  return {
    number: getPuzzleNumberForDate(date),
    language,
    date,
    waves,
  };
}

export function getTodaysPuzzle(language: string): NeonInterceptPuzzle | null {
  return getPuzzleForDate(language, getTodayUTC());
}

export type {
  NeonInterceptPuzzle,
  NeonInterceptPromptDefinition,
  NeonInterceptWave,
  NeonInterceptPromptKind,
} from "./types.ts";
