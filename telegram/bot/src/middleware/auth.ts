import { Context, NextFunction } from 'grammy';
import { getUser, createUser, User } from '../utils/user-store.js';

// Extend context to add user property
declare module 'grammy' {
  interface Context {
    dbUser?: User;
  }
}

/**
 * Authentication middleware
 * Creates user record on first message if it doesn't exist
 * Attaches user to context for easy access in commands
 */
export async function authMiddleware(ctx: Context, next: NextFunction) {
  if (!ctx.from) {
    return next();
  }

  const telegramId = ctx.from.id;
  let user = await getUser(telegramId);

  if (!user) {
    // Create new user
    user = await createUser({
      telegramId,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
      languageCode: ctx.from.language_code,
      joinedAt: new Date().toISOString(),
    });
  }

  // Attach user to context for commands to use
  ctx.dbUser = user;

  return next();
}
