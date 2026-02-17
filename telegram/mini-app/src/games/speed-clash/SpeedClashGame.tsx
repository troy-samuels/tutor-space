/**
 * SpeedClashGame — Fast reaction scenario-response game.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/GameShell';
import { ShareCard } from '@/components/ShareCard';
import { TutorCTA } from '@/components/TutorCTA';
import type { Scenario } from '@/data/speed-clash/scenarios';
import { getRandomScenarios } from '@/data/speed-clash/scenarios';
import { hapticPress, hapticCorrect, hapticWrong, hapticVictory, hapticTimerWarning } from '@/lib/haptics';
import { recordGamePlay } from '@/lib/streaks';
import { generateShareText } from './share';
import { Zap, Gauge, Timer } from 'lucide-react';

interface SpeedClashGameProps {
  language: string;
  puzzleNumber: number;
  onExit?: () => void;
}

const ROUNDS = 10;
const ROUND_TIME_MS = 10000;

export function SpeedClashGame({ language, puzzleNumber, onExit }: SpeedClashGameProps) {
  const [scenarios] = useState<Scenario[]>(() => getRandomScenarios(language, ROUNDS));
  const [currentRound, setCurrentRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [speeds, setSpeeds] = useState<number[]>([]);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [roundTimeLeft, setRoundTimeLeft] = useState(ROUND_TIME_MS);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warnedRef = useRef(false);

  const currentScenario = scenarios[currentRound];

  // Timer for each round
  useEffect(() => {
    if (isComplete || answered) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const start = Date.now();
    setRoundStartTime(start);
    setRoundTimeLeft(ROUND_TIME_MS);
    warnedRef.current = false;

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = ROUND_TIME_MS - elapsed;
      
      if (remaining <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setRoundTimeLeft(0);
        handleAnswer(-1);
        return;
      }
      
      if (remaining <= 3000 && !warnedRef.current) {
        warnedRef.current = true;
        hapticTimerWarning();
      }
      
      setRoundTimeLeft(remaining);
    }, 100);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentRound, answered, isComplete]);

  const handleAnswer = useCallback((index: number) => {
    if (answered || isComplete) return;

    const responseTime = Date.now() - roundStartTime;
    const isCorrect = index >= 0 && index === currentScenario.correctIndex;

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
    }, 1200);
  }, [answered, isComplete, roundStartTime, currentScenario, currentRound]);

  const avgSpeed = speeds.length > 0
    ? speeds.reduce((a, b) => a + b, 0) / speeds.length
    : 0;

  const shareText = isComplete
    ? generateShareText(puzzleNumber, language, correctCount, ROUNDS, avgSpeed)
    : '';

  if (!currentScenario) return null;

  const progress = ((currentRound) / ROUNDS) * 100;
  const timeProgress = (roundTimeLeft / ROUND_TIME_MS) * 100;

  return (
    <GameShell
      gameName="Speed Clash"
      puzzleNumber={puzzleNumber}
      language={language}
      onBack={onExit}
    >
      <div className="space-y-5">
        {/* Overall progress */}
        <div>
          <div className="w-full bg-card rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          <div className="text-sm text-muted text-center mt-1">Round {currentRound + 1}/{ROUNDS}</div>
        </div>

        {!isComplete ? (
          <>
            {/* Round timer */}
            <div>
              <div className="w-full bg-card rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${timeProgress <= 30 ? 'bg-destructive' : 'bg-success'}`}
                  style={{ width: `${timeProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-1 text-sm text-muted mt-1">
                <Timer size={14} />
                <span className={roundTimeLeft <= 3000 ? 'text-destructive font-bold' : 'text-muted'}>
                  {(roundTimeLeft / 1000).toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Scenario */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRound}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="space-y-3"
              >
                <div className="rounded-2.5xl border-2 border-white/10 bg-gradient-to-br from-card to-card/90 p-5 shadow-lg">
                  <div className="mb-2 text-xs text-muted font-semibold uppercase tracking-wide">
                    {currentScenario.situation}
                  </div>
                  <div className="text-xl font-bold leading-snug text-foreground">
                    {currentScenario.prompt}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentScenario.options.map((option, i) => {
                    let bgClass = 'bg-card border-white/10';
                    let textClass = 'text-foreground';

                    if (answered) {
                      if (i === currentScenario.correctIndex) {
                        bgClass = 'bg-success/20 border-success';
                        textClass = 'text-success';
                      } else if (i === selectedIndex) {
                        bgClass = 'bg-destructive/20 border-destructive';
                        textClass = 'text-destructive';
                      }
                    }

                    return (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, type: 'spring', stiffness: 150, damping: 20 }}
                        whileTap={answered ? {} : { scale: 0.98 }}
                        onClick={() => handleAnswer(i)}
                        disabled={answered}
                        className={`w-full rounded-xl border-2 p-4 text-left text-base font-medium transition-all shadow-sm ${bgClass} ${textClass} ${
                          answered ? 'cursor-not-allowed' : 'active:bg-card/80'
                        }`}
                      >
                        {option}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="space-y-4 mt-6"
          >
            <div className="rounded-2.5xl border-2 border-white/10 bg-card p-6 text-center shadow-xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
                className="text-5xl mb-2 flex justify-center text-primary"
              >
                <Zap size={50} strokeWidth={1.5} />
              </motion.div>
              <h2 className="mt-2 text-2xl font-bold text-foreground">
                Clash Complete!
              </h2>
              <div className="mt-4 space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {correctCount}/{ROUNDS}
                </div>
                <div className="text-md text-muted">Correct answers</div>
                {speeds.length > 0 && (
                  <div className="text-sm text-muted flex items-center justify-center gap-1 mt-2">
                    <Gauge size={16} strokeWidth={2} />
                    Avg speed: <span className="font-bold text-accent">{(avgSpeed / 1000).toFixed(1)}s</span>
                  </div>
                )}
              </div>
            </div>

            <ShareCard text={shareText} />
            {correctCount < ROUNDS * 0.7 && <TutorCTA />}
          </motion.div>
        )}
      </div>
    </GameShell>
  );
}
