import dotenv from 'dotenv';

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || (process.env.NODE_ENV === 'test' ? 'test_token' : ''),
  miniAppUrl: process.env.MINI_APP_URL || 'https://tutorlingua-telegram.vercel.app',
  webAppUrl: process.env.WEB_APP_URL || 'https://tutorlingua.com',
  notificationHour: parseInt(process.env.NOTIFICATION_HOUR || '8', 10),
  streakWarningHour: parseInt(process.env.STREAK_WARNING_HOUR || '20', 10),
  botUsername: process.env.BOT_USERNAME || 'TutorLinguaBot',
};

if (!config.botToken && process.env.NODE_ENV !== 'test') {
  throw new Error('BOT_TOKEN environment variable is required');
}
