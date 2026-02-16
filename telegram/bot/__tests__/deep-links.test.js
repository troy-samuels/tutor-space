import { describe, it, expect } from 'vitest';
import { parseStartParam, buildGameLink, buildReferralLink, buildChallengeLink } from '../src/utils/deep-links.js';
describe('parseStartParam', () => {
    it('should parse Connections game links', () => {
        const result = parseStartParam('c15');
        expect(result).toEqual({
            type: 'game',
            game: 'connections',
            puzzle: 15,
        });
    });
    it('should parse Spell Cast game links', () => {
        const result = parseStartParam('sc20');
        expect(result).toEqual({
            type: 'game',
            game: 'spellcast',
            puzzle: 20,
        });
    });
    it('should parse Speed Clash game links', () => {
        const result = parseStartParam('clash10');
        expect(result).toEqual({
            type: 'game',
            game: 'speedclash',
            puzzle: 10,
        });
    });
    it('should parse Word Runner links', () => {
        const result = parseStartParam('wr');
        expect(result).toEqual({
            type: 'game',
            game: 'wordrunner',
        });
    });
    it('should parse Vocab Clash links', () => {
        const result = parseStartParam('vc');
        expect(result).toEqual({
            type: 'game',
            game: 'vocabclash',
        });
    });
    it('should parse referral links', () => {
        const result = parseStartParam('ref_12345');
        expect(result).toEqual({
            type: 'referral',
            userId: '12345',
        });
    });
    it('should parse challenge links', () => {
        const result = parseStartParam('ch_abc123');
        expect(result).toEqual({
            type: 'challenge',
            challengeId: 'abc123',
        });
    });
    it('should handle empty parameter', () => {
        const result = parseStartParam('');
        expect(result).toEqual({
            type: 'unknown',
            raw: '',
        });
    });
    it('should handle invalid parameter', () => {
        const result = parseStartParam('invalid_param');
        expect(result).toEqual({
            type: 'unknown',
            raw: 'invalid_param',
        });
    });
    it('should handle malformed Connections link', () => {
        const result = parseStartParam('c');
        expect(result).toEqual({
            type: 'unknown',
            raw: 'c',
        });
    });
    it('should handle malformed Spell Cast link', () => {
        const result = parseStartParam('sc');
        expect(result).toEqual({
            type: 'unknown',
            raw: 'sc',
        });
    });
});
describe('buildGameLink', () => {
    it('should build Connections link with puzzle number', () => {
        const link = buildGameLink('connections', 15);
        expect(link).toBe('t.me/TutorLinguaBot?start=c15');
    });
    it('should build Connections link without puzzle number', () => {
        const link = buildGameLink('connections');
        expect(link).toBe('t.me/TutorLinguaBot?start=c1');
    });
    it('should build Spell Cast link', () => {
        const link = buildGameLink('spellcast', 20);
        expect(link).toBe('t.me/TutorLinguaBot?start=sc20');
    });
    it('should build Speed Clash link', () => {
        const link = buildGameLink('speedclash', 10);
        expect(link).toBe('t.me/TutorLinguaBot?start=clash10');
    });
    it('should build Word Runner link', () => {
        const link = buildGameLink('wordrunner');
        expect(link).toBe('t.me/TutorLinguaBot?start=wr');
    });
    it('should build Vocab Clash link', () => {
        const link = buildGameLink('vocabclash');
        expect(link).toBe('t.me/TutorLinguaBot?start=vc');
    });
    it('should handle unknown game with default', () => {
        const link = buildGameLink('unknown');
        expect(link).toBe('t.me/TutorLinguaBot?start=c1');
    });
});
describe('buildReferralLink', () => {
    it('should build referral link with numeric user ID', () => {
        const link = buildReferralLink(12345);
        expect(link).toBe('t.me/TutorLinguaBot?start=ref_12345');
    });
    it('should build referral link with string user ID', () => {
        const link = buildReferralLink('67890');
        expect(link).toBe('t.me/TutorLinguaBot?start=ref_67890');
    });
});
describe('buildChallengeLink', () => {
    it('should build challenge link', () => {
        const link = buildChallengeLink('abc123');
        expect(link).toBe('t.me/TutorLinguaBot?start=ch_abc123');
    });
    it('should build challenge link with complex ID', () => {
        const link = buildChallengeLink('ch_1234567890_xyz');
        expect(link).toBe('t.me/TutorLinguaBot?start=ch_ch_1234567890_xyz');
    });
});
