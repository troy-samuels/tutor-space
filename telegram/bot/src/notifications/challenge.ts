import { Bot, InlineKeyboard } from 'grammy';
import { Challenge, getUser } from '../utils/user-store.js';
import { buildChallengeLink, getGameDisplayName } from '../utils/deep-links.js';
import { config } from '../config.js';

/**
 * Send challenge notification when someone is challenged
 */
export async function sendChallengeNotification(
  bot: Bot,
  challenge: Challenge
) {
  try {
    const challenger = await getUser(challenge.challengerId);
    const challengerName = challenger?.username 
      ? `@${challenger.username}` 
      : challenger?.firstName || 'Someone';

    const gameName = getGameDisplayName(challenge.game);
    const challengeLink = buildChallengeLink(challenge.id);

    const keyboard = new InlineKeyboard()
      .webApp('✅ Accept Challenge', `${config.miniAppUrl}?challenge=${challenge.id}`)
      .row()
      .text('❌ Decline', `decline_challenge_${challenge.id}`);

    await bot.api.sendMessage(
      challenge.challengeeId,
      `⚔️ Challenge from ${challengerName}!\n\n` +
      `Game: ${gameName}\n` +
      `Can you beat their score?\n\n` +
      `${challengeLink}`,
      { reply_markup: keyboard }
    );

    return true;
  } catch (error) {
    console.error('Failed to send challenge notification:', error);
    return false;
  }
}

/**
 * Send notification when someone completes your challenge
 */
export async function sendChallengeCompletedNotification(
  bot: Bot,
  challenge: Challenge,
  result: { won: boolean; score: any }
) {
  try {
    const challengee = await getUser(challenge.challengeeId);
    const challengeeName = challengee?.username 
      ? `@${challengee.username}` 
      : challengee?.firstName || 'Your challenger';

    const gameName = getGameDisplayName(challenge.game);
    const resultEmoji = result.won ? '🏆' : '😢';
    const resultText = result.won 
      ? `${challengeeName} accepted your challenge and WON!`
      : `${challengeeName} accepted your challenge but you WON!`;

    await bot.api.sendMessage(
      challenge.challengerId,
      `${resultEmoji} Challenge Result\n\n` +
      `Game: ${gameName}\n` +
      `${resultText}\n\n` +
      `Want to challenge them again?`
    );

    return true;
  } catch (error) {
    console.error('Failed to send challenge completed notification:', error);
    return false;
  }
}

/**
 * Send notification when someone beats your score on the leaderboard
 */
export async function sendLeaderboardBeatenNotification(
  bot: Bot,
  userId: number,
  beaterName: string,
  game: string,
  oldRank: number,
  newRank: number
) {
  try {
    const gameName = getGameDisplayName(game);

    await bot.api.sendMessage(
      userId,
      `📉 Leaderboard Update\n\n` +
      `${beaterName} just beat your score in ${gameName}!\n\n` +
      `Your rank: ${oldRank} → ${newRank}\n\n` +
      `Time to reclaim your position! 💪`
    );

    return true;
  } catch (error) {
    console.error('Failed to send leaderboard beaten notification:', error);
    return false;
  }
}
