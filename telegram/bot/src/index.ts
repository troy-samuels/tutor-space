import { Bot } from 'grammy';
import { config } from './config.js';
import { authMiddleware } from './middleware/auth.js';
import { referralMiddleware } from './middleware/referral.js';
import { startCommand, handleLanguageSelection } from './commands/start.js';
import { playCommand } from './commands/play.js';
import { streakCommand } from './commands/streak.js';
import { challengeCommand, handleChallengeResponse } from './commands/challenge.js';
import { leaderboardCommand } from './commands/leaderboard.js';
import { helpCommand } from './commands/help.js';
import { handleGroupChallenge, showGroupLeaderboard, showGroupStats } from './group/commands.js';
import { sendDailyPuzzleNotifications } from './notifications/daily-puzzle.js';
import { sendStreakWarningNotifications } from './notifications/streak-warning.js';

console.log('🤖 Starting TutorLingua Bot...');

const bot = new Bot(config.botToken);

// Middleware
bot.use(authMiddleware);
bot.use(referralMiddleware);

// Commands
bot.command('start', startCommand);
bot.command('play', playCommand);
bot.command('streak', streakCommand);
bot.command('challenge', challengeCommand);
bot.command('leaderboard', leaderboardCommand);
bot.command('help', helpCommand);

// Callback query handlers
bot.callbackQuery(/^lang_/, handleLanguageSelection);
bot.callbackQuery(/^accept_challenge_/, (ctx) => handleChallengeResponse(ctx, true));
bot.callbackQuery(/^decline_challenge_/, (ctx) => handleChallengeResponse(ctx, false));
bot.callbackQuery('stats', async (ctx) => {
  await ctx.answerCallbackQuery();
  await streakCommand(ctx as any); // Reuse streak command for stats
});
bot.callbackQuery('streak', async (ctx) => {
  await ctx.answerCallbackQuery();
  await streakCommand(ctx as any);
});
bot.callbackQuery('invite', async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (userId) {
    const referralLink = `https://t.me/${config.botUsername}?start=ref_${userId}`;
    await ctx.reply(
      `👥 Invite Friends\n\n` +
      `Share your referral link to earn bonuses:\n\n` +
      `${referralLink}\n\n` +
      `Every friend who joins gets you a reward!`
    );
  }
});
bot.callbackQuery('remind_later', async (ctx) => {
  await ctx.answerCallbackQuery({ text: 'Okay, I\'ll remind you later!' });
  await ctx.editMessageText('⏰ I\'ll remind you in a bit. Don\'t forget to keep your streak alive!');
});

// Group-specific commands (only work in groups)
bot.command('groupchallenge', async (ctx) => {
  const args = ctx.message?.text?.split(' ') || [];
  const game = args[1] || 'connections';
  await handleGroupChallenge(ctx, game);
});

bot.command('groupleaderboard', showGroupLeaderboard);
bot.command('groupstats', showGroupStats);

// Unknown command handler
bot.on('message:text', async (ctx, next) => {
  const text = ctx.message.text;
  
  // Ignore non-command messages
  if (!text.startsWith('/')) {
    return next();
  }
  
  // Extract command
  const command = text.split(' ')[0].toLowerCase();
  const knownCommands = [
    '/start', '/play', '/streak', '/challenge', '/leaderboard', '/help',
    '/groupchallenge', '/groupleaderboard', '/groupstats'
  ];
  
  if (!knownCommands.some(cmd => command.startsWith(cmd))) {
    await ctx.reply(
      `❓ Unknown command: ${command}\n\n` +
      `Type /help to see available commands.`
    );
  }
  
  return next();
});

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('SIGINT received. Stopping bot...');
  bot.stop();
});
process.once('SIGTERM', () => {
  console.log('SIGTERM received. Stopping bot...');
  bot.stop();
});

// Start bot
console.log('✅ Bot configured. Starting polling...');
bot.start({
  onStart: (botInfo) => {
    console.log(`✨ Bot @${botInfo.username} is running!`);
    console.log(`📝 Commands registered: /start, /play, /streak, /challenge, /leaderboard, /help`);
  },
});

// Export for notification scheduling (to be called externally or via cron)
export { bot, sendDailyPuzzleNotifications, sendStreakWarningNotifications };
