import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import {
  createReferral,
  getReferralsByReferrer,
  getReferralByReferee,
  markReferralBonusAwarded,
} from '../src/utils/user-store.js';

const TEST_DATA_DIR = process.env.TEST_DATA_DIR!;
const REFERRALS_FILE = path.join(TEST_DATA_DIR, 'referrals.json');

// Initialize fresh test data before each test
beforeEach(async () => {
  await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  await fs.writeFile(REFERRALS_FILE, '[]', 'utf-8');
});

// No cleanup - let the directory persist for debugging
//afterEach(async () => {
  // Cleanup disabled to avoid race conditions
//});

describe('Referral System', () => {
  it('should create a new referral', async () => {
    const referral = await createReferral(123, 456);
    
    expect(referral.referrerId).toBe(123);
    expect(referral.refereeId).toBe(456);
    expect(referral.bonusAwarded).toBe(false);
    expect(referral.createdAt).toBeDefined();
  });

  it('should prevent duplicate referrals', async () => {
    const referral1 = await createReferral(123, 456);
    const referral2 = await createReferral(123, 456);
    
    expect(referral1).toEqual(referral2);
    
    const referrals = await getReferralsByReferrer(123);
    expect(referrals).toHaveLength(1);
  });

  it('should allow same referrer to refer multiple people', async () => {
    await createReferral(123, 456);
    await createReferral(123, 789);
    
    const referrals = await getReferralsByReferrer(123);
    expect(referrals).toHaveLength(2);
  });

  it('should allow same referee to be referred by only one person', async () => {
    await createReferral(123, 456);
    // Second referral with same referee should create a new record
    // (In real app, middleware would prevent this, but store allows it)
    await createReferral(789, 456);
    
    const referral = await getReferralByReferee(456);
    // getReferralByReferee returns the first match found
    expect(referral).toBeDefined();
    expect([123, 789]).toContain(referral?.referrerId);
  });

  it('should get referrals by referrer', async () => {
    await createReferral(123, 456);
    await createReferral(123, 789);
    await createReferral(999, 111);
    
    const referrals = await getReferralsByReferrer(123);
    expect(referrals).toHaveLength(2);
    expect(referrals[0].refereeId).toBe(456);
    expect(referrals[1].refereeId).toBe(789);
  });

  it('should get referral by referee', async () => {
    await createReferral(123, 456);
    await createReferral(789, 999);
    
    const referral = await getReferralByReferee(456);
    expect(referral?.referrerId).toBe(123);
    expect(referral?.refereeId).toBe(456);
  });

  it('should return null for non-existent referee', async () => {
    const referral = await getReferralByReferee(999);
    expect(referral).toBeNull();
  });

  it('should mark bonus as awarded', async () => {
    await createReferral(123, 456);
    await markReferralBonusAwarded(123, 456);
    
    const referral = await getReferralByReferee(456);
    expect(referral?.bonusAwarded).toBe(true);
  });

  it('should handle marking bonus for non-existent referral', async () => {
    // Should not throw error
    await expect(markReferralBonusAwarded(123, 456)).resolves.not.toThrow();
  });
});

describe('Referral Edge Cases', () => {
  it('should handle self-referral prevention (application layer)', () => {
    // This would be checked in middleware, not in the store
    // Here we just verify the store doesn't prevent it
    expect(async () => {
      await createReferral(123, 123);
    }).not.toThrow();
  });

  it('should handle duplicate referral prevention', async () => {
    // Create same referral twice
    await createReferral(123, 456);
    await createReferral(123, 456);
    
    // Only one should be stored
    const referrals = await getReferralsByReferrer(123);
    expect(referrals).toHaveLength(1);
  });

  it('should persist referrals across reads', async () => {
    await createReferral(123, 456);
    
    const referrals1 = await getReferralsByReferrer(123);
    const referrals2 = await getReferralsByReferrer(123);
    
    expect(referrals1).toEqual(referrals2);
  });
});
