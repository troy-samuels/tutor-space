"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book,
  Search,
  Filter,
  Star,
  Clock,
  TrendingUp,
  Plus,
  Play,
  Trash2,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { VocabStore } from "@/lib/vocabulary/store";
import type { VocabEntry, VocabStats } from "@/lib/vocabulary/types";

type TabValue = "all" | "due" | "mastered";

interface VocabularyBankProps {
  language?: string;
  onStartReview?: (words: VocabEntry[]) => void;
}

export default function VocabularyBank({
  language,
  onStartReview,
}: VocabularyBankProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [stats, setStats] = useState<VocabStats | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  // Load data
  useEffect(() => {
    loadData();
  }, [language, activeTab, searchQuery]);

  const loadData = () => {
    let filtered: VocabEntry[];

    if (activeTab === "all") {
      filtered = language
        ? VocabStore.getByLanguage(language)
        : VocabStore.getAll();
    } else if (activeTab === "due") {
      filtered = VocabStore.getDueForReview(language);
    } else {
      filtered = VocabStore.getMastered(language);
    }

    if (searchQuery) {
      filtered = VocabStore.filter({
        language,
        searchQuery,
      });
    }

    setEntries(filtered);
    setStats(VocabStore.getStats(language));
  };

  const toggleCard = (id: string) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStrengthColor = (entry: VocabEntry): string => {
    const accuracy =
      entry.totalReviews > 0
        ? (entry.correctCount / entry.totalReviews) * 100
        : 0;

    if (accuracy >= 80) return "text-emerald-500";
    if (accuracy >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getStrengthValue = (entry: VocabEntry): number => {
    return entry.totalReviews > 0
      ? (entry.correctCount / entry.totalReviews) * 100
      : 0;
  };

  const getDaysUntilReview = (entry: VocabEntry): string => {
    if (!entry.srsDueDate) return "Not reviewed";

    const now = new Date();
    const due = new Date(entry.srsDueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days`;
  };

  const handleStartReview = () => {
    const dueWords = VocabStore.getDueForReview(language);
    if (onStartReview) {
      onStartReview(dueWords);
    }
  };

  const handleDelete = (id: string) => {
    VocabStore.delete(id);
    loadData();
  };

  return (
    <div className="space-y-6 p-4">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.totalWords}</p>
                  <p className="text-xs text-muted-foreground">Total Words</p>
                </div>
                <Book className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.masteryRate}%</p>
                  <p className="text-xs text-muted-foreground">Mastery</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.wordsDueToday}</p>
                  <p className="text-xs text-muted-foreground">Due Today</p>
                </div>
                <Clock className="w-8 h-8 text-accent opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.averageAccuracy}%</p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        {stats && stats.wordsDueToday > 0 && (
          <Button onClick={handleStartReview} className="gap-2">
            <Play className="w-4 h-4" />
            Review {stats.wordsDueToday} Words
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All Words
        </button>
        <button
          onClick={() => setActiveTab("due")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "due"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Due for Review {stats && stats.wordsDueToday > 0 && `(${stats.wordsDueToday})`}
        </button>
        <button
          onClick={() => setActiveTab("mastered")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "mastered"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Mastered
        </button>
      </div>

      {/* Word List */}
      <div className="space-y-3">
        <AnimatePresence>
          {entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Book className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground">
                {activeTab === "due"
                  ? "No words due for review!"
                  : activeTab === "mastered"
                  ? "No mastered words yet. Keep practicing!"
                  : "No vocabulary words yet."}
              </p>
            </motion.div>
          ) : (
            entries.map((entry, index) => {
              const isFlipped = flippedCards.has(entry.id);
              const strength = getStrengthValue(entry);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => toggleCard(entry.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">
                              {isFlipped ? entry.translation : entry.word}
                            </h3>
                            {entry.topic && (
                              <Badge variant="secondary" className="text-xs">
                                {entry.topic}
                              </Badge>
                            )}
                          </div>

                          {isFlipped && entry.exampleSentence && (
                            <p className="text-sm text-muted-foreground italic mb-2">
                              {entry.exampleSentence}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Level: {entry.level}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getDaysUntilReview(entry)}
                            </span>
                            {entry.totalReviews > 0 && (
                              <span>
                                {entry.correctCount}/{entry.totalReviews} correct
                              </span>
                            )}
                          </div>

                          {entry.totalReviews > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-muted-foreground">
                                  Strength
                                </span>
                                <span
                                  className={`text-xs font-medium ${getStrengthColor(
                                    entry
                                  )}`}
                                >
                                  {Math.round(strength)}%
                                </span>
                              </div>
                              <Progress value={strength} className="h-1" />
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
