import { Bot, InlineKeyboard } from 'grammy';
import { getAllUsers } from '../utils/user-store.js';
import { config } from '../config.js';

/**
 * Send streak warning notifications to users who haven't played today
 * Should be called once per day at the streak warning hour (e.g., 8 PM)
 */
export async function sendStreakWarningNotifications(bot: Bot) {
  const users = await getAllUsers();
  
  // Filter for users who:
  // 1. Have notifications enabled
  // 2. Have an active streak (> 0)
  // 3. Haven't played today
  const today = new Date().toISOString().split('T')[0];
  const usersToWarn = users.filter(u => 
    u.notificationsEnabled && 
    u.streak > 0 && 
    (!u.lastPlayedDate || u.lastPlayedDate !== today)
  );

  console.log(`Sending streak warning notifications to ${usersToWarn.length} users...`);

  let successCount = 0;
  let errorCount = 0;

  for (const user of usersToWarn) {
    try {
      const keyboard = new InlineKeyboard()
        .webApp('⚡ Quick Play — 2 minutes', config.miniAppUrl)
        .row()
        .text('⏰ Remind Me Later', 'remind_later');

      await bot.api.sendMessage(
        user.telegramId,
        `⚠️ Don't break your ${user.streak}-day streak! 🔥\n\n` +
        `You haven't played today yet. Your streak resets at midnight.\n\n` +
        `Just one quick game to keep it going!`,
        { reply_markup: keyboard }
      );

      successCount++;
      
      // Rate limiting: small delay between messages
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Failed to send streak warning to user ${user.telegramId}:`, error);
      errorCount++;
    }
  }

  console.log(`Streak warning notifications sent: ${successCount} success, ${errorCount} errors`);
  
  return { successCount, errorCount };
}

/**
 * Handle "Remind Me Later" callback
 * Sends another reminder after a delay (e.g., 1 hour)
 */
export async function handleRemindLater(bot: Bot, userId: number) {
  // For MVP, just acknowledge
  // In production, would schedule another reminder
  
  console.log(`User ${userId} requested reminder later`);
  
  // Could use a job queue or setTimeout for production
  // For now, just log it
}
