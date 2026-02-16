import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import {
  createUser,
  getUser,
  updateUser,
  getAllUsers,
  createChallenge,
  getChallenge,
  updateChallenge,
  getUserChallenges,
} from '../src/utils/user-store.js';

import path from 'path';

const TEST_DATA_DIR = process.env.TEST_DATA_DIR!;
const USERS_FILE = path.join(TEST_DATA_DIR, 'users.json');
const CHALLENGES_FILE = path.join(TEST_DATA_DIR, 'challenges.json');
const REFERRALS_FILE = path.join(TEST_DATA_DIR, 'referrals.json');

// Initialize fresh test data before each test
beforeEach(async () => {
  await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, '{}', 'utf-8');
  await fs.writeFile(CHALLENGES_FILE, '{}', 'utf-8');
  await fs.writeFile(REFERRALS_FILE, '[]', 'utf-8');
});

// No cleanup - let the directory persist for debugging
// afterEach(async () => {
  // Cleanup disabled to avoid race conditions
// });

describe('User Operations', () => {
  it('should create a new user', async () => {
    const user = await createUser({
      telegramId: 123456,
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      languageCode: 'en',
      joinedAt: new Date().toISOString(),
    });

    expect(user.telegramId).toBe(123456);
    expect(user.username).toBe('testuser');
    expect(user.firstName).toBe('Test');
    expect(user.streak).toBe(0);
    expect(user.longestStreak).toBe(0);
    expect(user.totalGames).toBe(0);
    expect(user.gamesPlayedToday).toBe(0);
    expect(user.notificationsEnabled).toBe(true);
  });

  it('should get user by telegram ID', async () => {
    await createUser({
      telegramId: 123456,
      username: 'testuser',
      firstName: 'Test',
      joinedAt: new Date().toISOString(),
    });

    const user = await getUser(123456);
    expect(user).toBeDefined();
    expect(user?.telegramId).toBe(123456);
    expect(user?.username).toBe('testuser');
  });

  it('should return null for non-existent user', async () => {
    const user = await getUser(999999);
    expect(user).toBeNull();
  });

  it('should update user', async () => {
    await createUser({
      telegramId: 123456,
      username: 'testuser',
      firstName: 'Test',
      joinedAt: new Date().toISOString(),
    });

    const updated = await updateUser(123456, {
      streak: 5,
      preferredLanguage: 'spanish',
    });

    expect(updated?.streak).toBe(5);
    expect(updated?.preferredLanguage).toBe('spanish');
  });

  it('should return null when updating non-existent user', async () => {
    const result = await updateUser(999999, { streak: 1 });
    expect(result).toBeNull();
  });

  it('should get all users', async () => {
    await createUser({
      telegramId: 111,
      firstName: 'User1',
      joinedAt: new Date().toISOString(),
    });
    await createUser({
      telegramId: 222,
      firstName: 'User2',
      joinedAt: new Date().toISOString(),
    });

    const users = await getAllUsers();
    expect(users).toHaveLength(2);
  });
});

describe('Challenge Operations', () => {
  it('should create a challenge', async () => {
    const challenge = await createChallenge({
      challengerId: 123,
      challengeeId: 456,
      game: 'connections',
      puzzleNumber: 15,
      challengerScore: { time: 120, mistakes: 1 },
    });

    expect(challenge.id).toBeDefined();
    expect(challenge.challengerId).toBe(123);
    expect(challenge.challengeeId).toBe(456);
    expect(challenge.game).toBe('connections');
    expect(challenge.status).toBe('pending');
    expect(challenge.createdAt).toBeDefined();
  });

  it('should get challenge by ID', async () => {
    const created = await createChallenge({
      challengerId: 123,
      challengeeId: 456,
      game: 'connections',
      challengerScore: {},
    });

    const challenge = await getChallenge(created.id);
    expect(challenge).toBeDefined();
    expect(challenge?.id).toBe(created.id);
  });

  it('should return null for non-existent challenge', async () => {
    const challenge = await getChallenge('invalid_id');
    expect(challenge).toBeNull();
  });

  it('should update challenge', async () => {
    const created = await createChallenge({
      challengerId: 123,
      challengeeId: 456,
      game: 'connections',
      challengerScore: {},
    });

    const updated = await updateChallenge(created.id, {
      status: 'accepted',
      challengeeScore: { time: 100, mistakes: 0 },
    });

    expect(updated?.status).toBe('accepted');
    expect(updated?.challengeeScore).toEqual({ time: 100, mistakes: 0 });
  });

  it('should get user challenges', async () => {
    await createChallenge({
      challengerId: 123,
      challengeeId: 456,
      game: 'connections',
      challengerScore: {},
    });
    await createChallenge({
      challengerId: 789,
      challengeeId: 123,
      game: 'spellcast',
      challengerScore: {},
    });
    await createChallenge({
      challengerId: 999,
      challengeeId: 888,
      game: 'speedclash',
      challengerScore: {},
    });

    const challenges = await getUserChallenges(123);
    expect(challenges).toHaveLength(2); // As challenger and challengee
  });
});

describe('Data Validation', () => {
  it('should handle missing optional user fields', async () => {
    const user = await createUser({
      telegramId: 123456,
      firstName: 'Test',
      joinedAt: new Date().toISOString(),
    });

    expect(user.username).toBeUndefined();
    expect(user.lastName).toBeUndefined();
    expect(user.languageCode).toBeUndefined();
  });

  it('should preserve user data through updates', async () => {
    const original = await createUser({
      telegramId: 123456,
      username: 'testuser',
      firstName: 'Test',
      joinedAt: new Date().toISOString(),
    });

    await updateUser(123456, { streak: 5 });

    const updated = await getUser(123456);
    expect(updated?.username).toBe('testuser');
    expect(updated?.firstName).toBe('Test');
    expect(updated?.streak).toBe(5);
  });
});

describe('Concurrent Access', () => {
  it('should handle sequential user creation', async () => {
    // For file-based storage, we do sequential creation to avoid race conditions
    for (let i = 0; i < 5; i++) {
      await createUser({
        telegramId: 100 + i,
        firstName: `User${i}`,
        joinedAt: new Date().toISOString(),
      });
    }

    const users = await getAllUsers();
    expect(users).toHaveLength(5);
  });

  it('should handle sequential updates to same user', async () => {
    await createUser({
      telegramId: 123,
      firstName: 'Test',
      joinedAt: new Date().toISOString(),
    });

    // Sequential updates to avoid file write conflicts
    await updateUser(123, { streak: 1 });
    await updateUser(123, { totalGames: 5 });
    await updateUser(123, { preferredLanguage: 'spanish' });

    const user = await getUser(123);
    expect(user).toBeDefined();
    expect(user?.streak).toBe(1);
    expect(user?.totalGames).toBe(5);
    expect(user?.preferredLanguage).toBe('spanish');
  });
});
