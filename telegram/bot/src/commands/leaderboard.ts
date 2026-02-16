import { CommandContext, Context } from 'grammy';
import { getAllUsers } from '../utils/user-store.js';

/**
 * /leaderboard command handler
 * Shows top players globally or in a group
 */
export async function leaderboardCommand(ctx: CommandContext<Context>) {
  const chatType = ctx.chat?.type;
  const isGroup = chatType === 'group' || chatType === 'supergroup';

  if (isGroup) {
    await showGroupLeaderboard(ctx);
  } else {
    await showGlobalLeaderboard(ctx);
  }
}

async function showGlobalLeaderboard(ctx: Context) {
  const allUsers = await getAllUsers();
  
  // Sort by total games (or could be by streak, etc.)
  const topUsers = allUsers
    .sort((a, b) => b.totalGames - a.totalGames)
    .slice(0, 10);

  if (topUsers.length === 0) {
    await ctx.reply('No players yet! Be the first to play.');
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  let leaderboardText = '🏆 Global Leaderboard\n\n';

  topUsers.forEach((user, index) => {
    const position = index + 1;
    const medal = index < 3 ? medals[index] : `${position}.`;
    const name = user.username ? `@${user.username}` : user.firstName;
    const games = user.totalGames;
    const streak = user.streak;

    leaderboardText += `${medal} ${name}\n`;
    leaderboardText += `   ${games} games | 🔥 ${streak} day streak\n\n`;
  });

  await ctx.reply(leaderboardText);
}

async function showGroupLeaderboard(ctx: Context) {
  // For group leaderboards, we'd need to track which users are in which groups
  // For MVP, show a simplified message
  await ctx.reply(
    '🏆 Group Leaderboard\n\n' +
    'Group leaderboards are coming soon! 🚀\n\n' +
    'For now, use /leaderboard in a private chat with me to see the global rankings.'
  );

  // TODO: Full implementation would:
  // 1. Track group memberships
  // 2. Filter users by group
  // 3. Show group-specific rankings
  // 4. Include group-specific stats
}
