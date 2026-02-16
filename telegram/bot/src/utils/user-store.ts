import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow test override
const BASE_DATA_DIR = process.env.TEST_DATA_DIR || path.join(__dirname, '../../data');

const DATA_DIR = BASE_DATA_DIR;
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CHALLENGES_FILE = path.join(DATA_DIR, 'challenges.json');
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');

export interface User {
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  languageCode?: string;
  preferredLanguage?: 'spanish' | 'french' | 'german';
  joinedAt: string;
  streak: number;
  longestStreak: number;
  lastPlayedDate?: string;
  totalGames: number;
  gamesPlayedToday: number;
  notificationsEnabled: boolean;
  timezone?: string;
}

export interface Challenge {
  id: string;
  challengerId: number;
  challengeeId: number;
  game: string;
  puzzleNumber?: number;
  challengerScore: any;
  challengeeScore?: any;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface Referral {
  referrerId: number;
  refereeId: number;
  createdAt: string;
  bonusAwarded: boolean;
}

// Ensure data directory exists
async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

// Generic file operations with locking mechanism (simplified)
async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    throw error;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// User operations
export async function getUser(telegramId: number): Promise<User | null> {
  const users = await readJsonFile<Record<string, User>>(USERS_FILE, {});
  return users[telegramId.toString()] || null;
}

export async function createUser(user: Omit<User, 'streak' | 'longestStreak' | 'totalGames' | 'gamesPlayedToday' | 'notificationsEnabled'>): Promise<User> {
  const users = await readJsonFile<Record<string, User>>(USERS_FILE, {});
  
  const newUser: User = {
    ...user,
    streak: 0,
    longestStreak: 0,
    totalGames: 0,
    gamesPlayedToday: 0,
    notificationsEnabled: true,
  };
  
  users[user.telegramId.toString()] = newUser;
  await writeJsonFile(USERS_FILE, users);
  
  return newUser;
}

export async function updateUser(telegramId: number, updates: Partial<User>): Promise<User | null> {
  const users = await readJsonFile<Record<string, User>>(USERS_FILE, {});
  const user = users[telegramId.toString()];
  
  if (!user) {
    return null;
  }
  
  const updatedUser = { ...user, ...updates };
  users[telegramId.toString()] = updatedUser;
  await writeJsonFile(USERS_FILE, users);
  
  return updatedUser;
}

export async function getAllUsers(): Promise<User[]> {
  const users = await readJsonFile<Record<string, User>>(USERS_FILE, {});
  return Object.values(users);
}

// Challenge operations
export async function createChallenge(challenge: Omit<Challenge, 'id' | 'createdAt' | 'status'>): Promise<Challenge> {
  const challenges = await readJsonFile<Record<string, Challenge>>(CHALLENGES_FILE, {});
  
  const id = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newChallenge: Challenge = {
    ...challenge,
    id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  challenges[id] = newChallenge;
  await writeJsonFile(CHALLENGES_FILE, challenges);
  
  return newChallenge;
}

export async function getChallenge(challengeId: string): Promise<Challenge | null> {
  const challenges = await readJsonFile<Record<string, Challenge>>(CHALLENGES_FILE, {});
  return challenges[challengeId] || null;
}

export async function updateChallenge(challengeId: string, updates: Partial<Challenge>): Promise<Challenge | null> {
  const challenges = await readJsonFile<Record<string, Challenge>>(CHALLENGES_FILE, {});
  const challenge = challenges[challengeId];
  
  if (!challenge) {
    return null;
  }
  
  const updatedChallenge = { ...challenge, ...updates };
  challenges[challengeId] = updatedChallenge;
  await writeJsonFile(CHALLENGES_FILE, challenges);
  
  return updatedChallenge;
}

export async function getUserChallenges(userId: number): Promise<Challenge[]> {
  const challenges = await readJsonFile<Record<string, Challenge>>(CHALLENGES_FILE, {});
  return Object.values(challenges).filter(
    c => c.challengerId === userId || c.challengeeId === userId
  );
}

// Referral operations
export async function createReferral(referrerId: number, refereeId: number): Promise<Referral> {
  const referrals = await readJsonFile<Referral[]>(REFERRALS_FILE, []);
  
  // Check for duplicate
  const existing = referrals.find(
    r => r.referrerId === referrerId && r.refereeId === refereeId
  );
  
  if (existing) {
    return existing;
  }
  
  const newReferral: Referral = {
    referrerId,
    refereeId,
    createdAt: new Date().toISOString(),
    bonusAwarded: false,
  };
  
  referrals.push(newReferral);
  await writeJsonFile(REFERRALS_FILE, referrals);
  
  return newReferral;
}

export async function getReferralsByReferrer(referrerId: number): Promise<Referral[]> {
  const referrals = await readJsonFile<Referral[]>(REFERRALS_FILE, []);
  return referrals.filter(r => r.referrerId === referrerId);
}

export async function getReferralByReferee(refereeId: number): Promise<Referral | null> {
  const referrals = await readJsonFile<Referral[]>(REFERRALS_FILE, []);
  return referrals.find(r => r.refereeId === refereeId) || null;
}

export async function markReferralBonusAwarded(referrerId: number, refereeId: number): Promise<void> {
  const referrals = await readJsonFile<Referral[]>(REFERRALS_FILE, []);
  const referral = referrals.find(
    r => r.referrerId === referrerId && r.refereeId === refereeId
  );
  
  if (referral) {
    referral.bonusAwarded = true;
    await writeJsonFile(REFERRALS_FILE, referrals);
  }
}
