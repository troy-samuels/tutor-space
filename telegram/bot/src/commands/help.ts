import { CommandContext, Context } from 'grammy';

/**
 * /help command handler
 * Shows list of available commands and how to play
 */
export async function helpCommand(ctx: CommandContext<Context>) {
  const helpText = `🎮 TutorLingua Games Help\n\n` +
    `📝 Commands:\n` +
    `/start - Start the bot or open a specific game\n` +
    `/play [game] - Open the Mini App to play\n` +
    `/streak - Check your current streak\n` +
    `/challenge @user <game> - Challenge a friend\n` +
    `/leaderboard - View top players\n` +
    `/help - Show this help message\n\n` +
    `🎯 Games:\n` +
    `🔗 Connections - Group 16 words into 4 categories\n` +
    `🍯 Spell Cast - Find words on a honeycomb grid\n` +
    `⚡ Speed Clash - React faster than ghost racers\n` +
    `🏃 Word Runner - Endless runner with vocabulary\n` +
    `🃏 Vocab Clash - Battle with word cards\n\n` +
    `💡 How to Play:\n` +
    `1. Choose your language (Spanish, French, or German)\n` +
    `2. Tap "Play Now" to open the Mini App\n` +
    `3. Complete daily puzzles to build your streak\n` +
    `4. Share your results and challenge friends!\n\n` +
    `🔥 Streaks:\n` +
    `Play at least one game per day to maintain your streak.\n` +
    `Higher streaks unlock special rewards!\n\n` +
    `👥 Referrals:\n` +
    `Share your referral link to earn bonuses when friends join.\n` +
    `Use /start to get your personal referral link.\n\n` +
    `Need more help? Visit: https://tutorlingua.com/help`;

  await ctx.reply(helpText);
}
