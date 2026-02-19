"use client";

import * as React from "react";
import styles from "./RetroGameFrame.module.css";

interface RetroGameFrameProps {
  mode: "daily" | "practice";
  objective: string;
  score: number;
  streak: number;
  difficulty: number;
  feedback: string;
  showCountdown: boolean;
  countdownProgress: number;
  onCountdownTap: (value: number) => void;
  children: React.ReactNode;
}

export default function RetroGameFrame({
  mode,
  objective,
  score,
  streak,
  difficulty,
  feedback,
  showCountdown,
  countdownProgress,
  onCountdownTap,
  children,
}: RetroGameFrameProps) {
  return (
    <section className={styles.frame}>
      <header className={styles.header}>
        <p className={styles.objective}>{objective}</p>
        <span className={styles.mode}>{mode}</span>
      </header>

      <div className={styles.hud}>
        <article className={styles.hudCard}>
          <p className={styles.hudLabel}>Score</p>
          <p className={styles.hudValue}>{score}</p>
        </article>
        <article className={styles.hudCard}>
          <p className={styles.hudLabel}>Streak</p>
          <p className={styles.hudValue}>{streak}</p>
        </article>
        <article className={styles.hudCard}>
          <p className={styles.hudLabel}>Difficulty</p>
          <p className={styles.hudValue}>{difficulty}</p>
        </article>
      </div>

      <p className={styles.feedback} aria-live="polite">{feedback}</p>

      {showCountdown ? (
        <div className={styles.countdown}>
          {[3, 2, 1].map((value) => (
            <button
              key={value}
              type="button"
              className={styles.countdownButton}
              onPointerDown={() => onCountdownTap(value)}
              aria-label={`Tap ${value} to start`}
              disabled={countdownProgress >= 3 && value !== 1}
            >
              {value}
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.content}>{children}</div>
      )}
    </section>
  );
}
