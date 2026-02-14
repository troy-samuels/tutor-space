"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VocabStore } from "@/lib/vocabulary/store";
import type { VocabEntry } from "@/lib/vocabulary/types";
import type { QualityRating } from "@/lib/spaced-repetition/sm2";

interface VocabFlashcardProps {
  words: VocabEntry[];
  onComplete?: (results: ReviewResults) => void;
}

interface ReviewResults {
  totalWords: number;
  correctAnswers: number;
  averageResponseTime: number;
  reviewedWordIds: string[];
}

export default function VocabFlashcard({
  words,
  onComplete,
}: VocabFlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [results, setResults] = useState<
    Array<{ wordId: string; correct: boolean; responseTime: number }>
  >([]);

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;
  const correctCount = results.filter((r) => r.correct).length;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = (quality: QualityRating) => {
    if (!currentWord) return;

    const responseTime = Date.now() - startTime;
    const isCorrect = quality >= 3;

    // Record the review
    VocabStore.markReviewed(currentWord.id, quality, responseTime);

    // Store result
    setResults((prev) => [
      ...prev,
      {
        wordId: currentWord.id,
        correct: isCorrect,
        responseTime,
      },
    ]);

    // Move to next or finish
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setStartTime(Date.now());
    } else {
      // Session complete
      const totalTime = results.reduce((sum, r) => sum + r.responseTime, 0);
      const avgTime = totalTime / results.length;

      if (onComplete) {
        onComplete({
          totalWords: words.length,
          correctAnswers: correctCount + (isCorrect ? 1 : 0),
          averageResponseTime: avgTime,
          reviewedWordIds: results.map((r) => r.wordId),
        });
      }
    }
  };

  if (!currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Review Complete!</h2>
            <p className="text-muted-foreground mb-6">
              {correctCount} / {words.length} words correct
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Accuracy</p>
                <p className="text-xl font-semibold">
                  {Math.round((correctCount / words.length) * 100)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Words Reviewed</p>
                <p className="text-xl font-semibold">{words.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Word {currentIndex + 1} of {words.length}
          </span>
          <span>
            {correctCount} / {currentIndex} correct
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card
            className="cursor-pointer hover:border-primary/40 transition-colors h-80 flex items-center justify-center"
            onClick={handleFlip}
          >
            <CardContent className="text-center">
              <AnimatePresence mode="wait">
                {!isFlipped ? (
                  <motion.div
                    key="front"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-muted-foreground mb-2">
                      Translate this word:
                    </p>
                    <h2 className="text-4xl font-bold mb-4">
                      {currentWord.word}
                    </h2>
                    {currentWord.topic && (
                      <p className="text-sm text-muted-foreground">
                        Topic: {currentWord.topic}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-6">
                      Tap to reveal
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-muted-foreground mb-2">
                      Translation:
                    </p>
                    <h2 className="text-4xl font-bold mb-4 text-primary">
                      {currentWord.translation}
                    </h2>
                    {currentWord.exampleSentence && (
                      <p className="text-sm text-muted-foreground italic mt-4">
                        "{currentWord.exampleSentence}"
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Rating Buttons */}
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3 mt-4"
            >
              <Button
                variant="outline"
                className="flex-col h-auto py-3 gap-1 border-red-500/20 hover:bg-red-500/10 hover:border-red-500"
                onClick={() => handleRating(1)}
              >
                <X className="w-5 h-5 text-red-500" />
                <span className="text-xs">Again</span>
              </Button>

              <Button
                variant="outline"
                className="flex-col h-auto py-3 gap-1 border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500"
                onClick={() => handleRating(3)}
              >
                <RotateCcw className="w-5 h-5 text-yellow-500" />
                <span className="text-xs">Hard</span>
              </Button>

              <Button
                variant="outline"
                className="flex-col h-auto py-3 gap-1 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500"
                onClick={() => handleRating(5)}
              >
                <Check className="w-5 h-5 text-emerald-500" />
                <span className="text-xs">Easy</span>
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Stats Footer */}
      <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
        <span>Level: {currentWord.level}</span>
        <span>
          Reviews: {currentWord.totalReviews} (
          {currentWord.totalReviews > 0
            ? Math.round(
                (currentWord.correctCount / currentWord.totalReviews) * 100
              )
            : 0}
          % accuracy)
        </span>
      </div>
    </div>
  );
}
