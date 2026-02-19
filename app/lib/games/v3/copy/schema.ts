export type CopyLocale = "en" | "es";

export interface CopyPack {
  objective: string;
  streak: string;
  startTap: string;
  correct: string;
  wrong: string;
  timeout: string;
  progress: string;
  nextStep: string;
  shareWin: string;
  shareStumble: string;
  ghostHint: string;
  loadingAction: string;
}

export function isCopyLocale(value: string | null | undefined): value is CopyLocale {
  return value === "en" || value === "es";
}
