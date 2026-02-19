/**
 * Local token/points system for game unlocking.
 *
 * Tokens accumulate across ALL games. Users earn tokens by:
 *   - Completing a game: +10 tokens
 *   - Mastering a game (high score): +20 tokens
 *   - Sharing a result: +15 tokens (bonus!)
 *   - Daily streak bonus: +5 per streak day
 *
 * Tokens are spent to unlock new games. Sharing gives bonus
 * tokens to incentivise virality.
 *
 * For anonymous users: stored in localStorage.
 * For authenticated users: synced to Supabase via /api/games/meta/progress.
 */

const STORAGE_KEY = "tl-game-tokens";

/* ——— Token earn rates ——— */
export const TOKEN_REWARDS = {
  /** Completing any game run */
  GAME_COMPLETE: 10,
  /** Mastering a game (≥90% or won) */
  GAME_MASTERED: 20,
  /** Sharing a game result */
  SHARE_BONUS: 15,
  /** Per-day streak bonus (multiplied by streak count) */
  STREAK_BONUS: 5,
} as const;

/* ——— Game unlock costs ——— */
export interface GameUnlockDef {
  slug: string;
  unlockCost: number;
}

/**
 * Games and their token costs.
 * First 3 are free (cost 0). Others require progressively more tokens.
 * Coming-soon games have very high costs (won't be unlockable until built).
 */
export const GAME_UNLOCK_COSTS: GameUnlockDef[] = [
  // Free — always available
  { slug: "byte-choice", unlockCost: 0 },
  { slug: "pixel-pairs", unlockCost: 0 },
  { slug: "relay-sprint", unlockCost: 0 },
  // Unlock tier 1 (easy to reach)
  { slug: "connections", unlockCost: 30 },
  { slug: "daily-decode", unlockCost: 30 },
  // Unlock tier 2
  { slug: "word-ladder", unlockCost: 60 },
  { slug: "synonym-spiral", unlockCost: 60 },
  // Unlock tier 3
  { slug: "missing-piece", unlockCost: 100 },
  { slug: "odd-one-out", unlockCost: 100 },
  // Unlock tier 4
  { slug: "neon-intercept", unlockCost: 150 },
  // Coming soon — not built yet
  { slug: "grammar-rush", unlockCost: 9999 },
  { slug: "accent-match", unlockCost: 9999 },
  { slug: "idiom-hunt", unlockCost: 9999 },
  { slug: "tense-twist", unlockCost: 9999 },
];

/* ——— Data shape ——— */
export interface TokenState {
  /** Total tokens earned (lifetime) */
  totalEarned: number;
  /** Current token balance */
  balance: number;
  /** Slugs of games the user has unlocked */
  unlockedGames: string[];
  /** Track share bonuses per game per day to prevent spam */
  shareLog: Record<string, string>; // slug → last-share-date
}

function defaultState(): TokenState {
  return {
    totalEarned: 0,
    balance: 0,
    unlockedGames: ["byte-choice", "pixel-pairs", "relay-sprint"],
    shareLog: {},
  };
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

/* ——— Read/write ——— */

export function getTokenState(): TokenState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const state = JSON.parse(raw) as TokenState;
    // Ensure free games are always unlocked
    const freeGames = ["byte-choice", "pixel-pairs", "relay-sprint"];
    for (const slug of freeGames) {
      if (!state.unlockedGames.includes(slug)) {
        state.unlockedGames.push(slug);
      }
    }
    return state;
  } catch {
    return defaultState();
  }
}

function saveTokenState(state: TokenState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable
  }
}

/* ——— Token operations ——— */

/**
 * Award tokens for completing a game.
 * @returns The number of tokens awarded.
 */
export function awardGameComplete(mastered: boolean): number {
  const state = getTokenState();
  const reward = mastered ? TOKEN_REWARDS.GAME_MASTERED : TOKEN_REWARDS.GAME_COMPLETE;
  state.balance += reward;
  state.totalEarned += reward;
  saveTokenState(state);
  return reward;
}

/**
 * Award tokens for sharing a game result.
 * Limited to once per game per day to prevent spam.
 * @returns The number of tokens awarded (0 if already shared today).
 */
export function awardShareBonus(gameSlug: string): number {
  const state = getTokenState();
  const today = todayStr();

  // Already shared this game today?
  if (state.shareLog[gameSlug] === today) return 0;

  state.shareLog[gameSlug] = today;
  state.balance += TOKEN_REWARDS.SHARE_BONUS;
  state.totalEarned += TOKEN_REWARDS.SHARE_BONUS;
  saveTokenState(state);
  return TOKEN_REWARDS.SHARE_BONUS;
}

/**
 * Award streak bonus tokens.
 * @returns The number of tokens awarded.
 */
export function awardStreakBonus(streakDays: number): number {
  if (streakDays < 1) return 0;
  const state = getTokenState();
  const reward = TOKEN_REWARDS.STREAK_BONUS * streakDays;
  state.balance += reward;
  state.totalEarned += reward;
  saveTokenState(state);
  return reward;
}

/**
 * Try to unlock a game by spending tokens.
 * @returns true if the game was unlocked, false if insufficient tokens or already unlocked.
 */
export function unlockGame(slug: string): boolean {
  const state = getTokenState();

  // Already unlocked
  if (state.unlockedGames.includes(slug)) return true;

  // Find the cost
  const def = GAME_UNLOCK_COSTS.find((g) => g.slug === slug);
  if (!def) return false;

  // Not enough tokens
  if (state.balance < def.unlockCost) return false;

  state.balance -= def.unlockCost;
  state.unlockedGames.push(slug);
  saveTokenState(state);
  return true;
}

/**
 * Check if a game is unlocked.
 */
export function isGameUnlocked(slug: string): boolean {
  const state = getTokenState();
  return state.unlockedGames.includes(slug);
}

/**
 * Get the unlock cost for a game. Returns 0 for free games, -1 if not found.
 */
export function getUnlockCost(slug: string): number {
  const def = GAME_UNLOCK_COSTS.find((g) => g.slug === slug);
  return def ? def.unlockCost : -1;
}

/**
 * Get the next game(s) the user can unlock and the cheapest cost.
 */
export function getNextUnlockable(state: TokenState): GameUnlockDef[] {
  return GAME_UNLOCK_COSTS.filter(
    (g) => g.unlockCost > 0 && g.unlockCost < 9999 && !state.unlockedGames.includes(g.slug),
  ).sort((a, b) => a.unlockCost - b.unlockCost);
}
