import { Context, InlineKeyboard } from 'grammy';
import { getGameDisplayName } from '../utils/deep-links.js';
import { config } from '../config.js';

/**
 * Handle group challenge command
 * Starts a group race for a specific game
 */
export async function handleGroupChallenge(ctx: Context, game: string) {
  const chatType = ctx.chat?.type;
  const isGroup = chatType === 'group' || chatType === 'supergroup';

  if (!isGroup) {
    await ctx.reply('This command only works in groups!');
    return;
  }

  const gameName = getGameDisplayName(game);
  
  // Calculate today's puzzle number
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const puzzleNumber = dayOfYear;

  const keyboard = new InlineKeyboard()
    .webApp('🏁 Join Challenge', `${config.miniAppUrl}?game=${game}&puzzle=${puzzleNumber}&groupChallenge=true`);

  await ctx.reply(
    `🏁 GROUP CHALLENGE: ${gameName} #${puzzleNumber}\n\n` +
    `Who can solve it first?\n` +
    `🥇 10 XP bonus for the winner!\n\n` +
    `⏰ Challenge closes in 1 hour`,
    { reply_markup: keyboard }
  );

  // TODO: Track group challenge participants and results
  // For MVP, this is just a call-to-action
}

/**
 * Show group leaderboard
 */
export async function showGroupLeaderboard(ctx: Context) {
  const chatType = ctx.chat?.type;
  const isGroup = chatType === 'group' || chatType === 'supergroup';

  if (!isGroup) {
    await ctx.reply('This command only works in groups!');
    return;
  }

  // For MVP, show placeholder
  await ctx.reply(
    `🏆 Group Leaderboard\n\n` +
    `Coming soon! 🚀\n\n` +
    `We're building group-specific leaderboards.\n` +
    `For now, compete using /challenge!`
  );

  // TODO: Track group members and their scores
  // Show top 10 in this specific group
}

/**
 * Show group stats
 */
export async function showGroupStats(ctx: Context) {
  const chatType = ctx.chat?.type;
  const isGroup = chatType === 'group' || chatType === 'supergroup';

  if (!isGroup) {
    await ctx.reply('This command only works in groups!');
    return;
  }

  // For MVP, show placeholder
  await ctx.reply(
    `📊 Group Stats\n\n` +
    `Coming soon! 🚀\n\n` +
    `We'll show:\n` +
    `• Total games played by group\n` +
    `• Most active players\n` +
    `• Average scores\n` +
    `• Group streak records\n\n` +
    `Stay tuned!`
  );

  // TODO: Calculate and display group statistics
}

/**
 * Post challenge results to group
 * Called when a group challenge completes
 */
export async function postChallengeResults(
  ctx: Context,
  game: string,
  puzzleNumber: number,
  results: Array<{ username: string; time: string; mistakes: number }>
) {
  const chatType = ctx.chat?.type;
  const isGroup = chatType === 'group' || chatType === 'supergroup';

  if (!isGroup) {
    return;
  }

  const gameName = getGameDisplayName(game);
  const medals = ['🥇', '🥈', '🥉'];

  let resultsText = `🎉 Results for ${gameName} #${puzzleNumber}:\n\n`;
  
  results.forEach((result, index) => {
    const medal = index < 3 ? medals[index] : `${index + 1}.`;
    resultsText += `${medal} @${result.username} — ${result.time} (${result.mistakes} ${result.mistakes === 1 ? 'mistake' : 'mistakes'})\n`;
  });

  resultsText += `\nNext puzzle drops tomorrow at 8 AM!`;

  await ctx.reply(resultsText);
}
