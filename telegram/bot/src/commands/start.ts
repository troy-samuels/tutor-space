import { CommandContext, Context, InlineKeyboard } from 'grammy';
import { parseStartParam, getGameDisplayName } from '../utils/deep-links.js';
import { getChallenge } from '../utils/user-store.js';
import { updateUser } from '../utils/user-store.js';
import { config } from '../config.js';

/**
 * /start command handler
 * Handles deep links and onboarding flow
 */
export async function startCommand(ctx: CommandContext<Context>) {
  const user = ctx.dbUser;
  const telegramId = ctx.from?.id;

  if (!user || !telegramId) {
    await ctx.reply('❌ Something went wrong. Please try again.');
    return;
  }

  // Parse deep link parameter
  const commandText = ctx.message?.text || '';
  const parts = commandText.split(' ');
  const startParam = parts.length > 1 ? parts[1] : '';

  if (startParam) {
    const parsed = parseStartParam(startParam);

    // Handle game deep links
    if (parsed.type === 'game') {
      const gameName = getGameDisplayName(parsed.game);
      const puzzleText = parsed.puzzle ? ` #${parsed.puzzle}` : '';

      const keyboard = new InlineKeyboard()
        .webApp('🎮 Play Now', `${config.miniAppUrl}?game=${parsed.game}${parsed.puzzle ? `&puzzle=${parsed.puzzle}` : ''}`);

      await ctx.reply(
        `${gameName}${puzzleText}\n\n` +
        `Ready to play? Tap below to launch the game!`,
        { reply_markup: keyboard }
      );
      return;
    }

    // Handle challenge deep links
    if (parsed.type === 'challenge') {
      const challenge = await getChallenge(parsed.challengeId);

      if (!challenge) {
        await ctx.reply('❌ Challenge not found or expired.');
        return;
      }

      if (challenge.challengeeId !== telegramId) {
        await ctx.reply('❌ This challenge isn\'t for you!');
        return;
      }

      if (challenge.status !== 'pending') {
        await ctx.reply('❌ This challenge has already been completed or declined.');
        return;
      }

      const gameName = getGameDisplayName(challenge.game);
      const keyboard = new InlineKeyboard()
        .webApp('✅ Accept Challenge', `${config.miniAppUrl}?challenge=${parsed.challengeId}`)
        .row()
        .text('❌ Decline', `decline_challenge_${parsed.challengeId}`);

      await ctx.reply(
        `⚔️ Challenge from @${challenge.challengerId}!\n\n` +
        `Game: ${gameName}\n` +
        `Can you beat their score?\n\n` +
        `Accept to play!`,
        { reply_markup: keyboard }
      );
      return;
    }

    // Referrals are handled by middleware, just continue to welcome
  }

  // First time user - show language selection
  if (!user.preferredLanguage) {
    const keyboard = new InlineKeyboard()
      .text('🇪🇸 Spanish', 'lang_spanish')
      .text('🇫🇷 French', 'lang_french')
      .text('🇩🇪 German', 'lang_german');

    await ctx.reply(
      `🎮 Welcome to TutorLingua Games!\n\n` +
      `Daily word games to sharpen your language skills. Think Wordle, but for languages.\n\n` +
      `🔗 Connections — Group words into categories\n` +
      `🍯 Spell Cast — Build words on a honeycomb\n` +
      `⚡ Speed Clash — React faster than ghost racers\n` +
      `🏃 Word Runner — Endless runner with vocabulary\n` +
      `🃏 Vocab Clash — Battle with word cards\n\n` +
      `Pick your language to start:`,
      { reply_markup: keyboard }
    );
  } else {
    // Returning user - show main menu
    await showMainMenu(ctx, user.preferredLanguage);
  }
}

/**
 * Show main menu for returning users
 */
async function showMainMenu(ctx: Context, language: string) {
  const flagEmojis: Record<string, string> = {
    spanish: '🇪🇸',
    french: '🇫🇷',
    german: '🇩🇪',
  };
  const flag = flagEmojis[language] || '🌍';

  const keyboard = new InlineKeyboard()
    .webApp('🎮 Play Now', config.miniAppUrl)
    .row()
    .text('📊 My Stats', 'stats')
    .text('🔥 My Streak', 'streak')
    .row()
    .text('👥 Invite Friends', 'invite');

  await ctx.reply(
    `${flag} Welcome back!\n\n` +
    `Ready to play today's puzzles?`,
    { reply_markup: keyboard }
  );
}

/**
 * Handle language selection callback
 */
export async function handleLanguageSelection(ctx: Context) {
  const callbackData = ctx.callbackQuery?.data;
  const telegramId = ctx.from?.id;

  if (!callbackData || !telegramId) {
    return;
  }

  const language = callbackData.replace('lang_', '') as 'spanish' | 'french' | 'german';

  // Update user's preferred language
  await updateUser(telegramId, { preferredLanguage: language });

  const flagEmojis: Record<string, string> = {
    spanish: '🇪🇸',
    french: '🇫🇷',
    german: '🇩🇪',
  };
  const flag = flagEmojis[language];

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `${flag} Great choice! Let's play!\n\n` +
    `Tap below to start your first game:`
  );

  const keyboard = new InlineKeyboard()
    .webApp('🎮 Play Now', config.miniAppUrl)
    .row()
    .text('📊 My Stats', 'stats')
    .text('🔥 My Streak', 'streak')
    .row()
    .text('👥 Invite Friends', 'invite');

  await ctx.reply(
    `Ready when you are!`,
    { reply_markup: keyboard }
  );
}
