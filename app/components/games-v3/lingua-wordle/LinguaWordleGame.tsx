"use client";

import * as React from "react";
import { haptic } from "@/lib/games/haptics";
import { recordDailyProgress } from "@/lib/games/progress";
import { startGameRun, completeGameRun } from "@/lib/games/runtime/run-lifecycle";
import {
  getLinguaWordlePuzzle,
  getSpecialKeys,
  evaluateGuess,
  type TileState,
  type CefrTier,
  type WordEntry,
} from "@/lib/games/v3/data/lingua-wordle";
import SharePanel from "@/components/games-v3/core/SharePanel";
import styles from "./LinguaWordleGame.module.css";

const UI_VERSION = "v3-lingua-wordle-1";
const MAX_GUESSES = 6;

// ─────────────────────────────────────────────
// Props & Types
// ─────────────────────────────────────────────

interface Props {
  language: string;
  mode: "daily" | "practice";
  cefr?: CefrTier | null;
  challengeSeed?: number | null;
}

type GameState = "playing" | "won" | "lost";

interface HintState {
  categoryRevealed: boolean;
  firstLetterRevealed: boolean;
  exampleRevealed: boolean;
  secondLetterRevealed: boolean;
}

// ─────────────────────────────────────────────
// Keyboard layouts
// ─────────────────────────────────────────────

const QWERTY_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function LinguaWordleGame({
  language,
  mode,
  cefr = null,
  challengeSeed = null,
}: Props) {
  const puzzle = React.useMemo(
    () => getLinguaWordlePuzzle(language, cefr, challengeSeed),
    [language, cefr, challengeSeed],
  );
  const answer = puzzle.entry.word.toLowerCase();
  const wordLength = answer.length;
  const specialKeys = React.useMemo(() => getSpecialKeys(language), [language]);

  // ── Game state ──
  const [guesses, setGuesses] = React.useState<string[]>([]);
  const [evaluations, setEvaluations] = React.useState<TileState[][]>([]);
  const [currentGuess, setCurrentGuess] = React.useState("");
  const [gameState, setGameState] = React.useState<GameState>("playing");
  const [hints, setHints] = React.useState<HintState>({
    categoryRevealed: false,
    firstLetterRevealed: false,
    exampleRevealed: false,
    secondLetterRevealed: false,
  });
  const [shakeRow, setShakeRow] = React.useState(false);
  const [revealRow, setRevealRow] = React.useState(-1);
  const [bounceRow, setBounceRow] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [runId, setRunId] = React.useState("local-boot");
  const startedAtRef = React.useRef(Date.now());

  // ── Keyboard state: track which letters are green/yellow/grey ──
  const keyboardState = React.useMemo(() => {
    const map = new Map<string, TileState>();
    for (let r = 0; r < evaluations.length; r++) {
      const guess = guesses[r]!;
      const eval_ = evaluations[r]!;
      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i]!;
        const state = eval_[i]!;
        const current = map.get(letter);
        // Priority: correct > present > absent
        if (!current || state === "correct" || (state === "present" && current === "absent")) {
          map.set(letter, state);
        }
      }
    }
    return map;
  }, [evaluations, guesses]);

  // ── Start telemetry ──
  React.useEffect(() => {
    startedAtRef.current = Date.now();
    void startGameRun({
      gameSlug: "lingua-wordle",
      mode,
      language: language as "en" | "es" | "fr" | "de" | "it" | "pt",
      deviceClass: "mobile",
      gameVersion: "v3",
      startingCefr: cefr,
      calibratedDifficulty: 50,
      uiVersion: UI_VERSION,
    })
      .then((r) => setRunId(r.runId))
      .catch(() => setRunId(`local-${crypto.randomUUID()}`));
  }, [cefr, language, mode]);

  // ── Progressive hints (auto-reveal based on attempt count) ──
  React.useEffect(() => {
    const attempts = guesses.length;
    setHints({
      categoryRevealed: attempts >= 1,
      firstLetterRevealed: attempts >= 3,
      exampleRevealed: attempts >= 4,
      secondLetterRevealed: attempts >= 5,
    });
  }, [guesses.length]);

  // ── Toast auto-dismiss ──
  React.useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // ── Physical keyboard handler ──
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (gameState !== "playing") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Enter") {
        e.preventDefault();
        submitGuess();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        deleteLetter();
      } else if (e.key.length === 1 && /^[a-záéíóúñüàèìòùâêîôûäöëïç]$/i.test(e.key)) {
        e.preventDefault();
        addLetter(e.key.toLowerCase());
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGuess, gameState, guesses.length]);

  // ── Actions ──
  function addLetter(letter: string) {
    if (gameState !== "playing") return;
    if (currentGuess.length >= wordLength) return;
    setCurrentGuess((prev) => prev + letter);
  }

  function deleteLetter() {
    if (gameState !== "playing") return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  }

  function submitGuess() {
    if (gameState !== "playing") return;

    if (currentGuess.length !== wordLength) {
      setShakeRow(true);
      haptic("error");
      setToastMessage(`Word must be ${wordLength} letters`);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    const guess = currentGuess.toLowerCase();
    const evaluation = evaluateGuess(guess, answer);
    const rowIndex = guesses.length;

    setGuesses((prev) => [...prev, guess]);
    setEvaluations((prev) => [...prev, evaluation]);
    setCurrentGuess("");
    setRevealRow(rowIndex);

    // Determine win/loss after reveal animation
    const isWin = evaluation.every((s) => s === "correct");
    const isLoss = !isWin && rowIndex + 1 >= MAX_GUESSES;

    setTimeout(() => {
      setRevealRow(-1);
      if (isWin) {
        setGameState("won");
        setBounceRow(true);
        haptic("success");
        recordDailyProgress("lingua-wordle", true);
        completeRun(rowIndex + 1, true);
      } else if (isLoss) {
        setGameState("lost");
        haptic("error");
        recordDailyProgress("lingua-wordle", false);
        completeRun(rowIndex + 1, false);
      } else {
        haptic("tap");
      }
    }, wordLength * 150 + 200); // Wait for all tiles to flip
  }

  function completeRun(attempts: number, won: boolean) {
    void completeGameRun({
      runId,
      score: won ? MAX_GUESSES - attempts + 1 : 0,
      maxScore: MAX_GUESSES,
      accuracy: won ? Math.round(((MAX_GUESSES - attempts + 1) / MAX_GUESSES) * 100) : 0,
      timeMs: Date.now() - startedAtRef.current,
      mistakes: attempts - (won ? 1 : 0),
      maxCombo: 0,
      falseFriendHits: 0,
      firstCorrectMs: null,
      startingCefr: cefr,
      firstMeaningfulActionMs: null,
      replayed: false,
      tierReached: "foundation",
      curveVersion: "v3-static-1",
      uiVersion: UI_VERSION,
      gameVersion: "v3",
      calibratedDifficulty: 50,
      difficultyDelta: 0,
      cognitiveLoadState: "balanced",
      ahaSpike: won && attempts <= 2,
      shareCardVersion: "v3-share-1",
      metadata: {
        seed: puzzle.seed,
        puzzleNumber: puzzle.puzzleNumber,
        language,
        mode,
        answer,
        attempts,
        won,
      },
    }).catch(() => {});
  }

  // ── Share text ──
  function getShareText(): string {
    const won = gameState === "won";
    const header = `LinguaWordle #${puzzle.puzzleNumber} ${won ? guesses.length : "X"}/${MAX_GUESSES}`;
    const grid = evaluations
      .map((row) =>
        row.map((s) => (s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛")).join(""),
      )
      .join("\n");
    return `${header}\n\n${grid}\n\ntutorlingua.co/games/lingua-wordle`;
  }

  // ── Render helpers ──
  const filledRows = guesses.length;
  const totalRows = MAX_GUESSES;

  return (
    <div className={styles.game}>
      {/* Toast */}
      {toastMessage && (
        <div className={styles.toast}>{toastMessage}</div>
      )}

      {/* Clue */}
      <div className={styles.clueBar}>
        <span className={styles.clueLabel}>TRANSLATE</span>
        <span className={styles.clueWord}>{puzzle.entry.clue}</span>
        <span className={styles.clueLength}>{wordLength} letters</span>
      </div>

      {/* Progressive hints */}
      {hints.categoryRevealed && gameState === "playing" && (
        <div className={styles.hintsBar}>
          {hints.categoryRevealed && (
            <span className={styles.hint}>
              <span className={styles.hintIcon}>💡</span>
              Category: {puzzle.entry.category}
            </span>
          )}
          {hints.firstLetterRevealed && (
            <span className={styles.hint}>
              <span className={styles.hintIcon}>🔤</span>
              Starts with: <strong>{answer[0]!.toUpperCase()}</strong>
            </span>
          )}
          {hints.exampleRevealed && (
            <span className={styles.hint}>
              <span className={styles.hintIcon}>📖</span>
              &ldquo;{puzzle.entry.example}&rdquo;
            </span>
          )}
          {hints.secondLetterRevealed && answer.length > 1 && (
            <span className={styles.hint}>
              <span className={styles.hintIcon}>🔤</span>
              2nd letter: <strong>{answer[1]!.toUpperCase()}</strong>
            </span>
          )}
        </div>
      )}

      {/* Board */}
      <div className={styles.board} style={{ "--word-length": wordLength } as React.CSSProperties}>
        {Array.from({ length: totalRows }).map((_, rowIdx) => {
          const isFilledRow = rowIdx < filledRows;
          const isCurrentRow = rowIdx === filledRows && gameState === "playing";
          const isRevealingRow = rowIdx === revealRow;
          const isWinRow = gameState === "won" && rowIdx === filledRows - 1;

          return (
            <div
              key={rowIdx}
              className={styles.row}
              data-shake={isCurrentRow && shakeRow ? "true" : "false"}
              data-bounce={isWinRow && bounceRow ? "true" : "false"}
            >
              {Array.from({ length: wordLength }).map((_, colIdx) => {
                let letter = "";
                let state: TileState | "empty" | "tbd" = "empty";

                if (isFilledRow) {
                  letter = guesses[rowIdx]![colIdx] ?? "";
                  state = evaluations[rowIdx]![colIdx] ?? "absent";
                } else if (isCurrentRow) {
                  letter = currentGuess[colIdx] ?? "";
                  state = letter ? "tbd" : "empty";
                }

                return (
                  <div
                    key={colIdx}
                    className={styles.tile}
                    data-state={state}
                    data-reveal={isRevealingRow ? "true" : "false"}
                    style={
                      isRevealingRow
                        ? { animationDelay: `${colIdx * 150}ms` }
                        : isWinRow && bounceRow
                          ? { animationDelay: `${colIdx * 80}ms` }
                          : undefined
                    }
                  >
                    <span className={styles.tileLetter}>{letter.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Results panel */}
      {gameState !== "playing" && (
        <div className={styles.results}>
          {gameState === "won" ? (
            <div className={styles.resultsHeader}>
              <span className={styles.resultsEmoji}>
                {guesses.length <= 2 ? "🤯" : guesses.length <= 4 ? "⚡" : "✅"}
              </span>
              <h2 className={styles.resultsTitle}>
                {guesses.length <= 2 ? "Incredible!" : guesses.length <= 4 ? "Well done!" : "Got it!"}
              </h2>
              <p className={styles.resultsAttempts}>
                Solved in {guesses.length}/{MAX_GUESSES} attempts
              </p>
            </div>
          ) : (
            <div className={styles.resultsHeader}>
              <span className={styles.resultsEmoji}>📚</span>
              <h2 className={styles.resultsTitle}>The answer was:</h2>
              <p className={styles.answerReveal}>{answer.toUpperCase()}</p>
            </div>
          )}

          {/* Learning moment */}
          <LearnCard entry={puzzle.entry} />

          {/* Actions */}
          <div className={styles.resultsActions}>
            <button
              type="button"
              className={styles.shareBtn}
              onClick={() => {
                void navigator.clipboard?.writeText(getShareText());
                setToastMessage("Copied to clipboard!");
              }}
            >
              Share Result 📋
            </button>
            <button
              type="button"
              className={styles.playAgainBtn}
              onClick={() => location.reload()}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Keyboard */}
      {gameState === "playing" && (
        <div className={styles.keyboard}>
          {/* Special characters row */}
          {specialKeys.length > 0 && (
            <div className={styles.keyboardRow}>
              {specialKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={styles.key}
                  data-state={keyboardState.get(key) ?? "unused"}
                  data-special="true"
                  onPointerDown={() => addLetter(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          )}
          {/* QWERTY rows */}
          {QWERTY_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className={styles.keyboardRow}>
              {rowIdx === 2 && (
                <button
                  type="button"
                  className={styles.key}
                  data-wide="true"
                  onPointerDown={submitGuess}
                >
                  ✓
                </button>
              )}
              {row.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={styles.key}
                  data-state={keyboardState.get(key) ?? "unused"}
                  onPointerDown={() => addLetter(key)}
                >
                  {key}
                </button>
              ))}
              {rowIdx === 2 && (
                <button
                  type="button"
                  className={styles.key}
                  data-wide="true"
                  onPointerDown={deleteLetter}
                >
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Post-solve learning card
// ─────────────────────────────────────────────

function LearnCard({ entry }: { entry: WordEntry }) {
  return (
    <div className={styles.learnCard}>
      <div className={styles.learnHeader}>
        <span className={styles.learnWord}>{entry.word}</span>
        <span className={styles.learnMeaning}>{entry.clue}</span>
        <span className={styles.learnCefr}>{entry.cefr}</span>
      </div>
      <p className={styles.learnExample}>
        &ldquo;{entry.example.replace("___", `<strong>${entry.word}</strong>`)}&rdquo;
      </p>
      <div className={styles.learnRelated}>
        <span className={styles.learnRelatedLabel}>Related words:</span>
        {entry.related.map((w) => (
          <span key={w} className={styles.learnRelatedWord}>{w}</span>
        ))}
      </div>
    </div>
  );
}
