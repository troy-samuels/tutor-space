import { CommandContext, Context } from 'grammy';

/**
 * /streak command handler
 * Shows current streak data and progress
 */
export async function streakCommand(ctx: CommandContext<Context>) {
  const user = ctx.dbUser;

  if (!user) {
    await ctx.reply('❌ User data not found. Try /start first.');
    return;
  }

  const { streak, longestStreak, gamesPlayedToday, totalGames } = user;

  // Calculate streak tier
  const streakTier = getStreakTier(streak);

  // Next tier calculation
  const nextTier = getNextTier(streak);
  const nextTierText = nextTier 
    ? `\n\nKeep going! ${nextTier.daysNeeded} more ${nextTier.daysNeeded === 1 ? 'day' : 'days'} to reach ${nextTier.emoji} ${nextTier.name} tier.`
    : '\n\nYou\'ve reached the highest tier! 🎉';

  await ctx.reply(
    `🔥 Your Streak\n\n` +
    `Current: ${streak} ${streak === 1 ? 'day' : 'days'} (${streakTier.emoji} ${streakTier.name})\n` +
    `Longest: ${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}\n` +
    `Today: ${gamesPlayedToday}/5 games played\n` +
    `Total: ${totalGames} ${totalGames === 1 ? 'game' : 'games'}` +
    nextTierText
  );
}

interface StreakTier {
  name: string;
  emoji: string;
  minDays: number;
}

const STREAK_TIERS: StreakTier[] = [
  { name: 'Beginner', emoji: '🌱', minDays: 0 },
  { name: 'Committed', emoji: '⚡', minDays: 3 },
  { name: 'Consistent', emoji: '🔥', minDays: 7 },
  { name: 'Dedicated', emoji: '💎', minDays: 14 },
  { name: 'Champion', emoji: '🏆', minDays: 30 },
  { name: 'Legend', emoji: '👑', minDays: 60 },
  { name: 'Master', emoji: '🌟', minDays: 100 },
];

function getStreakTier(days: number): StreakTier {
  // Find the highest tier the user qualifies for
  for (let i = STREAK_TIERS.length - 1; i >= 0; i--) {
    if (days >= STREAK_TIERS[i].minDays) {
      return STREAK_TIERS[i];
    }
  }
  return STREAK_TIERS[0];
}

function getNextTier(days: number): { name: string; emoji: string; daysNeeded: number } | null {
  const currentTierIndex = STREAK_TIERS.findIndex((tier, i) => {
    const nextTier = STREAK_TIERS[i + 1];
    return days >= tier.minDays && (!nextTier || days < nextTier.minDays);
  });

  const nextTier = STREAK_TIERS[currentTierIndex + 1];
  if (!nextTier) {
    return null;
  }

  return {
    name: nextTier.name,
    emoji: nextTier.emoji,
    daysNeeded: nextTier.minDays - days,
  };
}
