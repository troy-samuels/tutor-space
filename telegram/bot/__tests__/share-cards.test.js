import { describe, it, expect } from 'vitest';
import { generateConnectionsShareCard, generateSpellCastShareCard, generateSpeedClashShareCard, generateWordRunnerShareCard, generateVocabClashShareCard, } from '../src/utils/share-cards.js';
describe('generateConnectionsShareCard', () => {
    it('should generate share card for completed puzzle', () => {
        const result = {
            puzzleNumber: 15,
            language: 'spanish',
            attempts: 2,
            completed: true,
            timeSeconds: 154,
            streak: 12,
            groups: ['yellow', 'green', 'blue', 'purple'],
        };
        const card = generateConnectionsShareCard(result);
        expect(card).toContain('🔗 Connections #15 🇪🇸');
        expect(card).toContain('🟨🟨🟨🟨');
        expect(card).toContain('🟩🟩🟩🟩');
        expect(card).toContain('🟦🟦🟦🟦');
        expect(card).toContain('🟪🟪🟪🟪');
        expect(card).toContain('✅ 2 mistakes');
        expect(card).toContain('⏱️ 2:34');
        expect(card).toContain('🔥 12-day streak');
        expect(card).toContain('t.me/TutorLinguaBot?start=c15');
    });
    it('should handle zero mistakes', () => {
        const result = {
            puzzleNumber: 10,
            language: 'french',
            attempts: 0,
            completed: true,
            timeSeconds: 90,
            groups: ['yellow', 'green', 'blue', 'purple'],
        };
        const card = generateConnectionsShareCard(result);
        expect(card).toContain('✅ 0 mistakes');
    });
    it('should handle failed puzzle', () => {
        const result = {
            puzzleNumber: 5,
            language: 'german',
            attempts: 5,
            completed: false,
            timeSeconds: 200,
            groups: ['yellow', 'green'],
        };
        const card = generateConnectionsShareCard(result);
        expect(card).toContain('❌ 5 mistakes');
    });
    it('should format time correctly for less than 1 minute', () => {
        const result = {
            puzzleNumber: 1,
            language: 'spanish',
            attempts: 1,
            completed: true,
            timeSeconds: 45,
            groups: ['yellow', 'green', 'blue', 'purple'],
        };
        const card = generateConnectionsShareCard(result);
        expect(card).toContain('⏱️ 0:45');
    });
});
describe('generateSpellCastShareCard', () => {
    it('should generate share card with all fields', () => {
        const result = {
            puzzleNumber: 20,
            language: 'french',
            score: 342,
            bestWord: 'BIBLIOTHÈQUE',
            bestWordLength: 12,
            bestWordLevel: 'C1',
            maxCombo: 5,
            percentile: 8,
        };
        const card = generateSpellCastShareCard(result);
        expect(card).toContain('🍯 Spell Cast #20 🇫🇷');
        expect(card).toContain('Score: 342 pts');
        expect(card).toContain('Best: BIBLIOTHÈQUE (12L, C1)');
        expect(card).toContain('⛓️ Max combo: 5x');
        expect(card).toContain('Top 8% today 🏆');
        expect(card).toContain('t.me/TutorLinguaBot?start=sc20');
    });
    it('should handle no combo', () => {
        const result = {
            puzzleNumber: 1,
            language: 'spanish',
            score: 100,
            bestWord: 'CASA',
            bestWordLength: 4,
            bestWordLevel: 'A1',
            maxCombo: 1,
        };
        const card = generateSpellCastShareCard(result);
        expect(card).not.toContain('Max combo');
    });
    it('should handle no percentile', () => {
        const result = {
            puzzleNumber: 1,
            language: 'german',
            score: 50,
            bestWord: 'HAUS',
            bestWordLength: 4,
            bestWordLevel: 'A1',
            maxCombo: 2,
        };
        const card = generateSpellCastShareCard(result);
        expect(card).not.toContain('Top');
        expect(card).not.toContain('%');
    });
});
describe('generateSpeedClashShareCard', () => {
    it('should generate share card with ghosts', () => {
        const result = {
            puzzleNumber: 7,
            language: 'german',
            correct: 8,
            total: 10,
            avgSpeed: 1.8,
            beatGhosts: ['Beginner', 'Regular'],
            lostToGhosts: ['Native'],
            streak: 14,
        };
        const card = generateSpeedClashShareCard(result);
        expect(card).toContain('⚡ Speed Clash #7 🇩🇪');
        expect(card).toContain('Score: 8/10 correct');
        expect(card).toContain('Avg speed: 1.8s');
        expect(card).toContain('Beat 🐢 🐇!');
        expect(card).toContain('Lost to ⚡');
        expect(card).toContain('🔥 14-day streak');
        expect(card).toContain('Race me: t.me/TutorLinguaBot?start=clash7');
    });
    it('should handle perfect score', () => {
        const result = {
            puzzleNumber: 1,
            language: 'spanish',
            correct: 10,
            total: 10,
            avgSpeed: 1.2,
            beatGhosts: ['Beginner', 'Regular', 'Native'],
            lostToGhosts: [],
        };
        const card = generateSpeedClashShareCard(result);
        expect(card).toContain('Score: 10/10 correct');
        expect(card).toContain('Beat 🐢 🐇 ⚡!');
        expect(card).not.toContain('Lost to');
    });
    it('should handle no ghosts beaten', () => {
        const result = {
            puzzleNumber: 1,
            language: 'french',
            correct: 5,
            total: 10,
            avgSpeed: 5.0,
            beatGhosts: [],
            lostToGhosts: ['Beginner', 'Regular', 'Native'],
        };
        const card = generateSpeedClashShareCard(result);
        expect(card).not.toContain('Beat');
        expect(card).toContain('Lost to 🐢 🐇 ⚡');
    });
});
describe('generateWordRunnerShareCard', () => {
    it('should generate share card', () => {
        const result = {
            distance: 847,
            score: 1240,
            speedLevel: 12,
            bestStreak: 23,
            livesLeft: 2,
        };
        const card = generateWordRunnerShareCard(result, 'spanish');
        expect(card).toContain('🏃 Word Runner 🇪🇸');
        expect(card).toContain('Distance: 847m');
        expect(card).toContain('Score: 1,240 pts');
        expect(card).toContain('Speed: Level 12');
        expect(card).toContain('Best streak: 23 words');
        expect(card).toContain('❤️❤️🖤');
        expect(card).toContain('Can you go further? t.me/TutorLinguaBot?start=wr');
    });
    it('should handle all lives remaining', () => {
        const result = {
            distance: 100,
            score: 200,
            speedLevel: 1,
            bestStreak: 5,
            livesLeft: 3,
        };
        const card = generateWordRunnerShareCard(result, 'french');
        expect(card).toContain('❤️❤️❤️');
    });
    it('should handle no lives remaining', () => {
        const result = {
            distance: 500,
            score: 800,
            speedLevel: 8,
            bestStreak: 15,
            livesLeft: 0,
        };
        const card = generateWordRunnerShareCard(result, 'german');
        expect(card).toContain('🖤🖤🖤');
    });
});
describe('generateVocabClashShareCard', () => {
    it('should generate share card for win', () => {
        const result = {
            won: true,
            score: '3-2',
            opponent: 'AI (Intermediate)',
            mvpCard: 'BIBLIOTHÈQUE',
            mvpRarity: 'Legendary',
            totalCards: 47,
        };
        const card = generateVocabClashShareCard(result, 'french');
        expect(card).toContain('🃏 Vocab Clash 🇫🇷');
        expect(card).toContain('🏆 Won 3-2 vs AI (Intermediate)');
        expect(card).toContain('MVP: BIBLIOTHÈQUE (Legendary 🟡)');
        expect(card).toContain('Collection: 47/200 cards');
        expect(card).toContain('Battle me: t.me/TutorLinguaBot?start=vc');
    });
    it('should generate share card for loss', () => {
        const result = {
            won: false,
            score: '1-3',
            opponent: 'AI (Advanced)',
            mvpCard: 'CASA',
            mvpRarity: 'Common',
            totalCards: 20,
        };
        const card = generateVocabClashShareCard(result, 'spanish');
        expect(card).toContain('💔 Lost 1-3 vs AI (Advanced)');
        expect(card).toContain('MVP: CASA (Common ⚪)');
    });
});
