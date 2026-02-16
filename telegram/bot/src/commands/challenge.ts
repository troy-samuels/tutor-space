import { CommandContext, Context, InlineKeyboard } from 'grammy';
import { createChallenge } from '../utils/user-store.js';
import { buildChallengeLink, getGameDisplayName } from '../utils/deep-links.js';

/**
 * /challenge command handler
 * Creates a challenge and sends it to another user
 */
export async function challengeCommand(ctx: CommandContext<Context>) {
  const user = ctx.dbUser;
  const telegramId = ctx.from?.id;

  if (!user || !telegramId) {
    await ctx.reply('❌ User data not found. Try /start first.');
    return;
  }

  const commandText = ctx.message?.text || '';
  const parts = commandText.split(' ').filter(p => p.length > 0);

  if (parts.length < 3) {
    await ctx.reply(
      `⚔️ Challenge a Friend\n\n` +
      `Usage: /challenge @username <game>\n\n` +
      `Games:\n` +
      `• connections\n` +
      `• spellcast\n` +
      `• speedclash\n` +
      `• wordrunner\n` +
      `• vocabclash\n\n` +
      `Example: /challenge @troy connections`
    );
    return;
  }

  // Parse username and game
  let username = parts[1];
  const gameName = parts[2].toLowerCase();

  // Remove @ if present
  if (username.startsWith('@')) {
    username = username.substring(1);
  }

  // Validate game name
  const validGames = ['connections', 'spellcast', 'speedclash', 'wordrunner', 'vocabclash'];
  if (!validGames.includes(gameName)) {
    await ctx.reply(`❌ Invalid game name. Choose from: ${validGames.join(', ')}`);
    return;
  }

  // In a real implementation, we'd look up the user by username
  // For MVP, we'll use a simplified approach
  await ctx.reply(
    `⚔️ Challenge Feature\n\n` +
    `To challenge @${username}, you need to:\n` +
    `1. Play ${getGameDisplayName(gameName)} first\n` +
    `2. Share your result\n` +
    `3. Send them the challenge link\n\n` +
    `For now, share your game link with them directly!\n\n` +
    `Type /play ${gameName} to start.`
  );

  // TODO: Full implementation would:
  // 1. Look up challengee by username
  // 2. Verify they exist and haven't blocked the bot
  // 3. Create challenge record
  // 4. Send inline keyboard to challengee
  // 5. Track challenge state
}

/**
 * Handle challenge acceptance/decline
 */
export async function handleChallengeResponse(ctx: Context, accept: boolean) {
  const callbackData = ctx.callbackQuery?.data;
  const telegramId = ctx.from?.id;

  if (!callbackData || !telegramId) {
    return;
  }

  const challengeId = callbackData.replace(accept ? 'accept_challenge_' : 'decline_challenge_', '');

  // TODO: Update challenge status and notify challenger

  if (accept) {
    await ctx.answerCallbackQuery({ text: 'Challenge accepted! Good luck!' });
    await ctx.editMessageText('✅ Challenge accepted! Opening game...');
  } else {
    await ctx.answerCallbackQuery({ text: 'Challenge declined' });
    await ctx.editMessageText('❌ Challenge declined');
  }
}
