import { Context as GrammyContext } from 'grammy';
import { User } from './utils/user-store.js';

export interface SessionData {
  user?: User;
}

export type BotContext = GrammyContext & {
  session?: SessionData;
};
