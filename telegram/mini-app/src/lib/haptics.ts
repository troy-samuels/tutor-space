/**
 * Contextual haptic feedback patterns for games.
 * Wraps Telegram WebApp haptics with game-specific semantic patterns.
 */

import { tg } from '@/telegram';

/**
 * Tile/card selection (light tap).
 */
export function hapticSelect(): void {
  tg.hapticSelectionChanged();
}

/**
 * Tile/card tap (light impact).
 */
export function hapticTap(): void {
  tg.hapticLight();
}

/**
 * Button press (medium impact).
 */
export function hapticPress(): void {
  tg.hapticMedium();
}

/**
 * Correct answer/match (success notification).
 */
export function hapticCorrect(): void {
  tg.hapticSuccess();
}

/**
 * Wrong answer/match (error notification).
 */
export function hapticWrong(): void {
  tg.hapticError();
}

/**
 * Warning/hint (warning notification).
 */
export function hapticHint(): void {
  tg.hapticWarning();
}

/**
 * Game complete/victory (heavy + success).
 */
export function hapticVictory(): void {
  tg.hapticHeavy();
  setTimeout(() => tg.hapticSuccess(), 100);
}

/**
 * Game over/defeat (heavy + error).
 */
export function hapticDefeat(): void {
  tg.hapticHeavy();
  setTimeout(() => tg.hapticError(), 100);
}

/**
 * Shuffle/randomize (light vibration pattern).
 */
export function hapticShuffle(): void {
  tg.hapticLight();
  setTimeout(() => tg.hapticLight(), 50);
  setTimeout(() => tg.hapticLight(), 100);
}

/**
 * Word found/valid (medium + success).
 */
export function hapticWordFound(): void {
  tg.hapticMedium();
  setTimeout(() => tg.hapticSuccess(), 80);
}

/**
 * Combo/streak bonus (escalating pattern).
 */
export function hapticCombo(level: number): void {
  const intensity = Math.min(level, 3);
  for (let i = 0; i < intensity; i++) {
    setTimeout(() => {
      if (i === intensity - 1) {
        tg.hapticHeavy();
      } else {
        tg.hapticMedium();
      }
    }, i * 80);
  }
}

/**
 * Timer warning (pulsing pattern for last 10 seconds).
 */
export function hapticTimerWarning(): void {
  tg.hapticWarning();
}

/**
 * Category reveal (ascending pattern).
 */
export function hapticReveal(): void {
  tg.hapticLight();
  setTimeout(() => tg.hapticMedium(), 100);
  setTimeout(() => tg.hapticSuccess(), 200);
}
