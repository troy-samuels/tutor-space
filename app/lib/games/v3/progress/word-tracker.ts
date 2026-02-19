// ──────────────────────────────────────────────
// Spaced-repetition progress tracker for Byte Choice
// Persists per-word mastery data in localStorage
// ──────────────────────────────────────────────

const STORAGE_KEY = "tl-byte-choice-progress";
const CURRENT_VERSION = 1;

// ── Types ──

export interface WordProgress {
  /** Number of times seen */
  seen: number;
  /** Number of times answered correctly */
  correct: number;
  /** Number of times answered wrong */
  wrong: number;
  /** Timestamp of last seen */
  lastSeen: number;
  /** Timestamp of last wrong answer (for spaced repetition) */
  lastWrong: number | null;
  /** Current mastery level: 0=new, 1=seen, 2=learning, 3=familiar, 4=mastered */
  mastery: 0 | 1 | 2 | 3 | 4;
  /** Circular buffer of last N results (true=correct) for streak tracking */
  recentResults: boolean[];
}

export interface ProgressStore {
  /** Map of "languagePair:prompt" → WordProgress */
  words: Record<string, WordProgress>;
  /** Total games played per language */
  gamesPlayed: Record<string, number>;
  /** Schema version for future migrations */
  version: number;
}

// ── Defaults ──

function defaultStore(): ProgressStore {
  return { words: {}, gamesPlayed: {}, version: CURRENT_VERSION };
}

function defaultWordProgress(): WordProgress {
  return {
    seen: 0,
    correct: 0,
    wrong: 0,
    lastSeen: 0,
    lastWrong: null,
    mastery: 0,
    recentResults: [],
  };
}

// ── Storage helpers ──

function isServer(): boolean {
  return typeof window === "undefined";
}

function readRaw(): ProgressStore {
  if (isServer()) return defaultStore();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultStore();

    const obj = parsed as Record<string, unknown>;

    // Validate shape — be lenient but ensure required keys exist
    if (typeof obj.version !== "number") return defaultStore();
    if (!obj.words || typeof obj.words !== "object") return defaultStore();
    if (!obj.gamesPlayed || typeof obj.gamesPlayed !== "object") return defaultStore();

    // Future: handle migrations when version !== CURRENT_VERSION
    return {
      words: obj.words as Record<string, WordProgress>,
      gamesPlayed: obj.gamesPlayed as Record<string, number>,
      version: CURRENT_VERSION,
    };
  } catch {
    // JSON parse error or any other issue — start fresh
    return defaultStore();
  }
}

function writeStore(store: ProgressStore): void {
  if (isServer()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or blocked — silently fail
  }
}

// ── Key helper ──

function wordKey(languagePair: string, prompt: string): string {
  return `${languagePair}:${prompt}`;
}

// ── Mastery calculation ──

function computeMastery(wp: WordProgress): 0 | 1 | 2 | 3 | 4 {
  if (wp.seen === 0) return 0;
  if (wp.seen <= 2) return 1;

  const accuracy = wp.seen > 0 ? wp.correct / wp.seen : 0;

  // Check mastered: 5+ seen, 85%+ accuracy, no wrong in last 3
  if (wp.seen >= 5 && accuracy >= 0.85) {
    const last3 = wp.recentResults.slice(-3);
    const noRecentWrong = last3.length >= 3 && last3.every(Boolean);
    if (noRecentWrong) return 4;
  }

  // Familiar: 3+ seen, 70%+ accuracy
  if (accuracy >= 0.7) return 3;

  // Learning: 3+ seen, accuracy < 70%
  return 2;
}

// ── Public API ──

/** Get the full progress store from localStorage */
export function getProgressStore(): ProgressStore {
  return readRaw();
}

/** Record a result for a word after answering */
export function recordWordResult(
  languagePair: string,
  prompt: string,
  correct: boolean,
): void {
  const store = readRaw();
  const key = wordKey(languagePair, prompt);
  const wp = store.words[key] ?? defaultWordProgress();
  const now = Date.now();

  wp.seen += 1;
  wp.lastSeen = now;

  if (correct) {
    wp.correct += 1;
  } else {
    wp.wrong += 1;
    wp.lastWrong = now;
  }

  // Keep last 5 results for streak checking
  wp.recentResults = [...wp.recentResults, correct].slice(-5);
  wp.mastery = computeMastery(wp);

  store.words[key] = wp;
  writeStore(store);
}

/** Get progress for a specific word */
export function getWordProgress(
  languagePair: string,
  prompt: string,
): WordProgress | null {
  const store = readRaw();
  const key = wordKey(languagePair, prompt);
  return store.words[key] ?? null;
}

/** Increment games played counter */
export function recordGamePlayed(languagePair: string): void {
  const store = readRaw();
  store.gamesPlayed[languagePair] = (store.gamesPlayed[languagePair] ?? 0) + 1;
  writeStore(store);
}

// ── Stored CEFR level helpers ──

const LEVEL_STORAGE_KEY = "tl-byte-choice-level";

export function getStoredLevel(): "A1" | "A2" | "B1" | "B2" | null {
  if (isServer()) return null;
  try {
    const raw = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { level?: string; timestamp?: number };
    if (
      parsed.level === "A1" ||
      parsed.level === "A2" ||
      parsed.level === "B1" ||
      parsed.level === "B2"
    ) {
      return parsed.level;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredLevel(level: "A1" | "A2" | "B1" | "B2"): void {
  if (isServer()) return;
  try {
    localStorage.setItem(
      LEVEL_STORAGE_KEY,
      JSON.stringify({ level, timestamp: Date.now() }),
    );
  } catch {
    // localStorage full or blocked — silently fail
  }
}

/** Get summary stats for display */
export function getProgressSummary(languagePair: string): {
  totalWords: number;
  mastered: number;
  learning: number;
  needsReview: number;
  gamesPlayed: number;
} {
  const store = readRaw();
  const prefix = `${languagePair}:`;

  let totalWords = 0;
  let mastered = 0;
  let learning = 0;
  let needsReview = 0;

  for (const [key, wp] of Object.entries(store.words)) {
    if (!key.startsWith(prefix)) continue;
    totalWords++;

    switch (wp.mastery) {
      case 4:
        mastered++;
        break;
      case 2:
      case 3:
        learning++;
        break;
      case 1:
        // Seen but not enough data — count as learning
        learning++;
        break;
    }

    // Words with recent wrong answers need review
    if (wp.lastWrong !== null && wp.mastery < 4) {
      needsReview++;
    }
  }

  return {
    totalWords,
    mastered,
    learning,
    needsReview,
    gamesPlayed: store.gamesPlayed[languagePair] ?? 0,
  };
}
