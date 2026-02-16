import { Context, NextFunction } from 'grammy';
import { parseStartParam } from '../utils/deep-links.js';
import { createReferral, getReferralByReferee, markReferralBonusAwarded } from '../utils/user-store.js';

/**
 * Referral tracking middleware
 * Extracts referral info from /start deep links and tracks referrals
 */
export async function referralMiddleware(ctx: Context, next: NextFunction) {
  // Only process /start commands
  if (!ctx.message || !ctx.message.text || !ctx.message.text.startsWith('/start')) {
    return next();
  }

  const parts = ctx.message.text.split(' ');
  if (parts.length < 2) {
    return next();
  }

  const startParam = parts[1];
  const parsed = parseStartParam(startParam);

  // Handle referral links
  if (parsed.type === 'referral') {
    const referrerId = parseInt(parsed.userId, 10);
    const refereeId = ctx.from?.id;

    if (!refereeId || isNaN(referrerId)) {
      return next();
    }

    // Prevent self-referral
    if (referrerId === refereeId) {
      await ctx.reply('❌ You can\'t refer yourself!');
      return next();
    }

    // Check if already referred
    const existingReferral = await getReferralByReferee(refereeId);
    if (existingReferral) {
      // Already referred, just continue
      return next();
    }

    // Create referral
    await createReferral(referrerId, refereeId);

    // Award bonus notification (simplified - just notify for now)
    try {
      await ctx.api.sendMessage(
        referrerId,
        `🎉 Great news! Someone joined TutorLingua using your referral link!\n\n` +
        `You've earned a bonus reward. Keep sharing to earn more!`
      );
    } catch (error) {
      // Referrer may have blocked the bot, ignore error
      console.error('Failed to send referral notification:', error);
    }

    // Mark bonus as awarded
    await markReferralBonusAwarded(referrerId, refereeId);

    // Show welcome message to referee
    await ctx.reply(
      `🎁 Welcome! You've joined via a referral link.\n\n` +
      `You've received a welcome bonus to get you started!`
    );
  }

  return next();
}
