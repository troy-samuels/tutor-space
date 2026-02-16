/**
 * Cross-game streak management (localStorage).
 * Streaks persist without login.
 */

const STORAGE_KEY = "tl-game-streaks";

export interface StreakData {
  current: number;
  longest: number;
  lastPlayedDate: string; // YYYY-MM-DD
  totalGamesPlayed: number;
  gamesPlayedToday: string[]; // game slugs played today
  streakPoints: number; // accumulated points
}

const DEFAULT_STREAK: StreakData = {
  current: 0,
  longest: 0,
  lastPlayedDate: "",
  totalGamesPlayed: 0,
  gamesPlayedToday: [],
  streakPoints: 0,
};

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

/**
 * Read streak data from localStorage.
 */
export function getStreakData(): StreakData {
  if (typeof window === "undefined") return DEFAULT_STREAK;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STREAK;
    return JSON.parse(raw) as StreakData;
  } catch {
    return DEFAULT_STREAK;
  }
}

/**
 * Record a game play and update streaks.
 */
export function recordGamePlay(gameSlug: string): StreakData {
  const data = getStreakData();
  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  // Reset games played today if it's a new day
  if (data.lastPlayedDate !== today) {
    data.gamesPlayedToday = [];
  }

  // Update streak
  if (data.lastPlayedDate === today) {
    // Already played today — just add game if not already played
    if (!data.gamesPlayedToday.includes(gameSlug)) {
      data.gamesPlayedToday.push(gameSlug);
    }
  } else if (data.lastPlayedDate === yesterday) {
    // Played yesterday — streak continues
    data.current += 1;
    data.gamesPlayedToday = [gameSlug];
  } else if (data.lastPlayedDate === "") {
    // First ever play
    data.current = 1;
    data.gamesPlayedToday = [gameSlug];
  } else {
    // Streak broken
    data.current = 1;
    data.gamesPlayedToday = [gameSlug];
  }

  data.lastPlayedDate = today;
  data.totalGamesPlayed += 1;
  data.longest = Math.max(data.longest, data.current);

  // Award streak points
  data.streakPoints += Math.min(data.current, 10); // cap at 10 per play

  // Save
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  return data;
}

/**
 * Get streak tier and perks.
 */
export function getStreakTier(streakDays: number): {
  name: string;
  emoji: string;
  perk?: string;
} {
  if (streakDays >= 30) return { name: "Legend", emoji: "👑", perk: "Free level assessment session" };
  if (streakDays >= 14) return { name: "Dedicated", emoji: "💎", perk: "10-min tutor conversation" };
  if (streakDays >= 7) return { name: "Committed", emoji: "🔥", perk: "Themed word pack unlocked" };
  if (streakDays >= 3) return { name: "Building", emoji: "⚡" };
  if (streakDays >= 1) return { name: "Started", emoji: "✨" };
  return { name: "New", emoji: "🌱" };
}
