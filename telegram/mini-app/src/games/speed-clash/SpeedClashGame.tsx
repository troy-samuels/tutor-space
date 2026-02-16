/**
 * SpeedClashGame — Fast reaction scenario-response game.
 * Simplified version without ghost racers for MVP.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/GameShell';
import { ShareCard } from '@/components/ShareCard';
import { TutorCTA } from '@/components/TutorCTA';
import type { Scenario } from '@/data/speed-clash/scenarios';
import { getRandomScenarios } from '@/data/speed-clash/scenarios';
import { hapticPress, hapticCorrect, hapticWrong, hapticVictory } from '@/lib/haptics';
import { recordGamePlay } from '@/lib/streaks';
import { generateShareText } from './share';

interface SpeedClashGameProps {
  language: string;
  puzzleNumber: number;
  onExit?: () => void;
}

const ROUNDS = 10;
const ROUND_TIME_MS = 10000; // 10 seconds per round

export function SpeedClashGame({ language, puzzleNumber, onExit }: SpeedClashGameProps) {
  const [scenarios] = useState<Scenario[]>(() => getRandomScenarios(language, ROUNDS));
  const [currentRound, setCurrentRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [speeds, setSpeeds] = useState<number[]>([]);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const currentScenario = scenarios[currentRound];

  // Start new round
  useEffect(() => {
    if (answered || isComplete) return;
    setRoundStartTime(Date.now());
  }, [currentRound, answered, isComplete]);

  const handleAnswer = useCallback((index: number) => {
    if (answered || isComplete) return;

    const responseTime = Date.now() - roundStartTime;
    const isCorrect = index === currentScenario.correctIndex;

    hapticPress();
    setSelectedIndex(index);
    setAnswered(true);

    if (isCorrect) {
      hapticCorrect();
      setCorrectCount((prev) => prev + 1);
      setSpeeds((prev) => [...prev, responseTime]);
    } else {
      hapticWrong();
    }

    // Move to next round after delay
    setTimeout(() => {
      if (currentRound + 1 < ROUNDS) {
        setCurrentRound((prev) => prev + 1);
        setAnswered(false);
        setSelectedIndex(null);
      } else {
        setIsComplete(true);
        hapticVictory();
        recordGamePlay('speed-clash');
      }
    }, 1500);
  }, [answered, isComplete, roundStartTime, currentScenario, currentRound]);

  const avgSpeed = speeds.length > 0
    ? speeds.reduce((a, b) => a + b, 0) / speeds.length
    : 0;

  const shareText = isComplete
    ? generateShareText(puzzleNumber, language, correctCount, ROUNDS, avgSpeed)
    : '';

  if (!currentScenario) return null;

  return (
    <GameShell
      gameName="Speed Clash"
      puzzleNumber={puzzleNumber}
      language={language}
      onBack={onExit}
    >
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-foreground">
            Round {currentRound + 1}/{ROUNDS}
          </span>
          <span className="text-muted">
            {correctCount} correct
          </span>
        </div>

        {!isComplete ? (
          <>
            {/* Scenario */}
            <motion.div
              key={currentRound}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <div className="rounded-2xl border border-white/10 bg-card p-5">
                <div className="mb-2 text-xs text-muted">{currentScenario.situation}</div>
                <div className="text-lg font-bold leading-snug text-foreground">
                  {currentScenario.prompt}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentScenario.options.map((option, i) => {
                  let bgClass = 'bg-card border-white/10';
                  let textClass = 'text-foreground';

                  if (answered) {
                    if (i === currentScenario.correctIndex) {
                      bgClass = 'bg-green-500/20 border-green-500';
                      textClass = 'text-green-500';
                    } else if (i === selectedIndex) {
                      bgClass = 'bg-destructive/20 border-destructive';
                      textClass = 'text-destructive';
                    }
                  }

                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileTap={answered ? {} : { scale: 0.97 }}
                      onClick={() => handleAnswer(i)}
                      disabled={answered}
                      className={`w-full rounded-xl border-2 p-4 text-left text-sm font-medium transition-all ${bgClass} ${textClass} ${
                        answered ? '' : 'active:bg-primary/20'
                      }`}
                    >
                      {option}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {/* Result banner */}
            <div className="rounded-2xl border border-white/10 bg-card p-6 text-center">
              <div className="text-4xl">⚡</div>
              <h2 className="mt-2 text-xl font-bold text-foreground">
                Round Complete!
              </h2>
              <div className="mt-4 space-y-2">
                <div className="text-2xl font-bold text-primary">
                  {correctCount}/{ROUNDS}
                </div>
                <div className="text-sm text-muted">Correct answers</div>
                <div className="text-xs text-muted">
                  Avg speed: {(avgSpeed / 1000).toFixed(1)}s
                </div>
              </div>
            </div>

            {/* Share */}
            <ShareCard text={shareText} />

            {/* Tutor CTA */}
            {correctCount < 7 && <TutorCTA />}
          </motion.div>
        )}
      </div>
    </GameShell>
  );
}
