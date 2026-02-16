import { Bot, InlineKeyboard } from 'grammy';
import { getAllUsers } from '../utils/user-store.js';
import { config } from '../config.js';

/**
 * Send daily puzzle notifications to all opted-in users
 * Should be called once per day at the configured notification hour
 */
export async function sendDailyPuzzleNotifications(bot: Bot) {
  const users = await getAllUsers();
  const optedInUsers = users.filter(u => u.notificationsEnabled);

  console.log(`Sending daily puzzle notifications to ${optedInUsers.length} users...`);

  let successCount = 0;
  let errorCount = 0;

  for (const user of optedInUsers) {
    try {
      // TODO: Respect user timezone preference
      // For MVP, send to everyone at the same UTC time

      const streak = user.streak;
      const streakEmoji = getStreakEmoji(streak);
      const streakTier = getStreakTier(streak);

      // Calculate today's puzzle numbers (simplified - use date-based calculation)
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
      const puzzleNumber = dayOfYear;

      const keyboard = new InlineKeyboard()
        .webApp('🎮 Play Now', config.miniAppUrl);

      await bot.api.sendMessage(
        user.telegramId,
        `☀️ Good morning!\n\n` +
        `Today's puzzles are ready:\n\n` +
        `🔗 Connections #${puzzleNumber}\n` +
        `🍯 Spell Cast #${puzzleNumber}\n` +
        `⚡ Speed Clash #${puzzleNumber}\n` +
        `🏃 Word Runner (endless)\n` +
        `🃏 Vocab Clash (battle)\n\n` +
        `🔥 Streak: ${streak} ${streak === 1 ? 'day' : 'days'} | ${streakEmoji} ${streakTier}`,
        { reply_markup: keyboard }
      );

      successCount++;
      
      // Rate limiting: small delay between messages
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Failed to send notification to user ${user.telegramId}:`, error);
      errorCount++;
    }
  }

  console.log(`Daily puzzle notifications sent: ${successCount} success, ${errorCount} errors`);
  
  return { successCount, errorCount };
}

function getStreakEmoji(streak: number): string {
  if (streak === 0) return '🌱';
  if (streak < 3) return '🔥';
  if (streak < 7) return '⚡';
  if (streak < 14) return '💎';
  if (streak < 30) return '🏆';
  if (streak < 60) return '👑';
  return '🌟';
}

function getStreakTier(streak: number): string {
  if (streak === 0) return 'Beginner';
  if (streak < 3) return 'Committed';
  if (streak < 7) return 'Consistent';
  if (streak < 14) return 'Dedicated';
  if (streak < 30) return 'Champion';
  if (streak < 60) return 'Legend';
  return 'Master';
}
