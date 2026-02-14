/**
 * Vocabulary Store
 * 
 * localStorage-based vocabulary management with SM-2 spaced repetition
 */

import { VocabEntry, VocabStats, VocabFilter } from "./types";
import { calculateSM2, type QualityRating } from "@/lib/spaced-repetition/sm2";

const STORAGE_KEY = "tl_vocab_bank";
const STATS_KEY = "tl_vocab_stats";

export class VocabStore {
  /**
   * Get all vocabulary entries
   */
  static getAll(): VocabEntry[] {
    if (typeof window === "undefined") return [];
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored) as VocabEntry[];
    } catch {
      return [];
    }
  }

  /**
   * Get a single entry by ID
   */
  static get(id: string): VocabEntry | null {
    const all = this.getAll();
    return all.find((entry) => entry.id === id) || null;
  }

  /**
   * Get entries by language
   */
  static getByLanguage(language: string): VocabEntry[] {
    return this.getAll().filter((entry) => entry.language === language);
  }

  /**
   * Get entries due for review
   */
  static getDueForReview(language?: string): VocabEntry[] {
    const all = language ? this.getByLanguage(language) : this.getAll();
    const now = new Date();
    
    return all.filter((entry) => {
      if (!entry.srsDueDate) return true; // Never reviewed
      return new Date(entry.srsDueDate) <= now;
    });
  }

  /**
   * Get mastered entries (high ease factor + long interval)
   */
  static getMastered(language?: string): VocabEntry[] {
    const all = language ? this.getByLanguage(language) : this.getAll();
    
    return all.filter((entry) => {
      return entry.srsEaseFactor >= 2.5 && entry.srsInterval >= 30;
    });
  }

  /**
   * Filter entries
   */
  static filter(filter: VocabFilter): VocabEntry[] {
    let results = this.getAll();

    if (filter.language) {
      results = results.filter((e) => e.language === filter.language);
    }

    if (filter.level) {
      results = results.filter((e) => e.level === filter.level);
    }

    if (filter.topic) {
      results = results.filter((e) => e.topic === filter.topic);
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter((e) =>
        filter.tags!.some((tag) => e.tags?.includes(tag))
      );
    }

    if (filter.dueOnly) {
      const now = new Date();
      results = results.filter((e) => {
        if (!e.srsDueDate) return true;
        return new Date(e.srsDueDate) <= now;
      });
    }

    if (filter.masteredOnly) {
      results = results.filter(
        (e) => e.srsEaseFactor >= 2.5 && e.srsInterval >= 30
      );
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      results = results.filter(
        (e) =>
          e.word.toLowerCase().includes(query) ||
          e.translation.toLowerCase().includes(query) ||
          e.exampleSentence?.toLowerCase().includes(query)
      );
    }

    return results;
  }

  /**
   * Add a new entry
   */
  static add(entry: Omit<VocabEntry, "id" | "createdAt" | "updatedAt">): VocabEntry {
    const newEntry: VocabEntry = {
      ...entry,
      id: `vocab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const all = this.getAll();
    
    // Check for duplicates
    const exists = all.find(
      (e) =>
        e.word.toLowerCase() === newEntry.word.toLowerCase() &&
        e.language === newEntry.language
    );

    if (exists) {
      return exists; // Return existing instead of duplicate
    }

    all.push(newEntry);
    this.saveAll(all);
    
    return newEntry;
  }

  /**
   * Update an existing entry
   */
  static update(id: string, updates: Partial<VocabEntry>): VocabEntry | null {
    const all = this.getAll();
    const index = all.findIndex((e) => e.id === id);
    
    if (index === -1) return null;

    all[index] = {
      ...all[index],
      ...updates,
      id: all[index].id, // Never update ID
      updatedAt: new Date().toISOString(),
    };

    this.saveAll(all);
    return all[index];
  }

  /**
   * Mark a word as reviewed and update SM-2 parameters
   */
  static markReviewed(
    id: string,
    quality: QualityRating,
    responseTimeMs?: number
  ): VocabEntry | null {
    const entry = this.get(id);
    if (!entry) return null;

    // Calculate new SM-2 parameters
    const sm2Result = calculateSM2(quality, {
      easeFactor: entry.srsEaseFactor,
      intervalDays: entry.srsInterval,
      repetitionCount: entry.srsRepetitions,
      lastReviewAt: entry.lastPracticed,
    });

    // Update stats
    const isCorrect = quality >= 3;
    const updates: Partial<VocabEntry> = {
      lastPracticed: new Date().toISOString(),
      correctCount: entry.correctCount + (isCorrect ? 1 : 0),
      incorrectCount: entry.incorrectCount + (isCorrect ? 0 : 1),
      totalReviews: entry.totalReviews + 1,
      srsDueDate: sm2Result.nextReviewDate.toISOString(),
      srsEaseFactor: sm2Result.easeFactor,
      srsInterval: sm2Result.interval,
      srsRepetitions: sm2Result.repetitions,
    };

    return this.update(id, updates);
  }

  /**
   * Delete an entry
   */
  static delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter((e) => e.id !== id);
    
    if (filtered.length === all.length) return false; // Not found
    
    this.saveAll(filtered);
    return true;
  }

  /**
   * Get statistics
   */
  static getStats(language?: string): VocabStats {
    const entries = language ? this.getByLanguage(language) : this.getAll();
    
    if (entries.length === 0) {
      return {
        totalWords: 0,
        masteryRate: 0,
        wordsDueToday: 0,
        wordsReviewedToday: 0,
        averageAccuracy: 0,
        strongestTopics: [],
        weakestTopics: [],
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dueToday = entries.filter((e) => {
      if (!e.srsDueDate) return true;
      return new Date(e.srsDueDate) <= now;
    });

    const reviewedToday = entries.filter((e) => {
      if (!e.lastPracticed) return false;
      const lastPracticed = new Date(e.lastPracticed);
      return lastPracticed >= today;
    });

    const mastered = entries.filter(
      (e) => e.srsEaseFactor >= 2.5 && e.srsInterval >= 30
    );

    const totalReviews = entries.reduce((sum, e) => sum + e.totalReviews, 0);
    const totalCorrect = entries.reduce((sum, e) => sum + e.correctCount, 0);

    // Topic strength
    const topicStats: Record<string, { correct: number; total: number }> = {};
    entries.forEach((e) => {
      if (e.topic && e.totalReviews > 0) {
        if (!topicStats[e.topic]) {
          topicStats[e.topic] = { correct: 0, total: 0 };
        }
        topicStats[e.topic].correct += e.correctCount;
        topicStats[e.topic].total += e.totalReviews;
      }
    });

    const topicAccuracies = Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    return {
      totalWords: entries.length,
      masteryRate: Math.round((mastered.length / entries.length) * 100),
      wordsDueToday: dueToday.length,
      wordsReviewedToday: reviewedToday.length,
      averageAccuracy:
        totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0,
      strongestTopics: topicAccuracies.slice(0, 3).map((t) => t.topic),
      weakestTopics: topicAccuracies.slice(-3).reverse().map((t) => t.topic),
    };
  }

  /**
   * Import words from practice session
   */
  static importFromPractice(
    words: Array<{
      word: string;
      translation: string;
      language: string;
      level: string;
      topic?: string;
      exampleSentence?: string;
    }>
  ): VocabEntry[] {
    const imported: VocabEntry[] = [];

    for (const word of words) {
      const entry = this.add({
        ...word,
        lastPracticed: null,
        correctCount: 0,
        incorrectCount: 0,
        totalReviews: 0,
        srsDueDate: null,
        srsEaseFactor: 2.5,
        srsInterval: 1,
        srsRepetitions: 0,
        source: "practice",
      });
      imported.push(entry);
    }

    return imported;
  }

  /**
   * Clear all entries (for testing/reset)
   */
  static clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STATS_KEY);
  }

  /**
   * Save all entries to localStorage
   */
  private static saveAll(entries: VocabEntry[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
}
