import type { RuntimeModeConfig } from "@/lib/games/runtime/modes";
import type { NeonInterceptPromptKind } from "@/lib/games/data/neon-intercept/types";

interface WaveScoreArgs {
  combo: number;
  kind: NeonInterceptPromptKind;
  modeConfig: RuntimeModeConfig;
}

const BASE_POINTS = 12;
const BOSS_BONUS = 8;
const FALSE_FRIEND_BASE_BONUS = 6;

export function computeWaveScore(args: WaveScoreArgs): number {
  const comboBonus = Math.min(args.combo, 6) * 2;
  const consistencyBonus = args.combo >= 3 ? 2 : 0;
  const kindBonus = args.kind === "boss"
    ? BOSS_BONUS
    : args.kind === "false-friend"
      ? Math.round(FALSE_FRIEND_BASE_BONUS * args.modeConfig.falseFriendMultiplier)
      : 0;

  return Math.round((BASE_POINTS + comboBonus + consistencyBonus + kindBonus) * args.modeConfig.scoreMultiplier);
}

export function computeWaveScoreCeiling(modeConfig: RuntimeModeConfig): number {
  const comboMax = 6 * 2;
  const consistencyBonus = 2;
  const kindMax = Math.max(BOSS_BONUS, Math.round(FALSE_FRIEND_BASE_BONUS * modeConfig.falseFriendMultiplier));
  return Math.round((BASE_POINTS + comboMax + consistencyBonus + kindMax) * modeConfig.scoreMultiplier);
}
