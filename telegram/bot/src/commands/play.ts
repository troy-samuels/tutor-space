import { CommandContext, Context, InlineKeyboard } from 'grammy';
import { config } from '../config.js';

/**
 * /play command handler
 * Opens the Mini App, optionally with a specific game
 */
export async function playCommand(ctx: CommandContext<Context>) {
  const commandText = ctx.message?.text || '';
  const parts = commandText.split(' ');
  const gameName = parts.length > 1 ? parts[1].toLowerCase() : '';

  let miniAppUrl = config.miniAppUrl;
  let messageText = '🎮 Let\'s play!\n\nChoose your game:';

  // Map game names to URL parameters
  const gameMapping: Record<string, string> = {
    connections: 'connections',
    spellcast: 'spellcast',
    spell: 'spellcast',
    speedclash: 'speedclash',
    speed: 'speedclash',
    clash: 'speedclash',
    wordrunner: 'wordrunner',
    runner: 'wordrunner',
    vocabclash: 'vocabclash',
    vocab: 'vocabclash',
  };

  if (gameName && gameMapping[gameName]) {
    miniAppUrl = `${config.miniAppUrl}?game=${gameMapping[gameName]}`;
    
    const gameDisplayNames: Record<string, string> = {
      connections: '🔗 Connections',
      spellcast: '🍯 Spell Cast',
      speedclash: '⚡ Speed Clash',
      wordrunner: '🏃 Word Runner',
      vocabclash: '🃏 Vocab Clash',
    };
    
    messageText = `${gameDisplayNames[gameMapping[gameName]]}\n\nReady to play?`;
  }

  const keyboard = new InlineKeyboard()
    .webApp('🎮 Play Now', miniAppUrl);

  await ctx.reply(messageText, { reply_markup: keyboard });
}
