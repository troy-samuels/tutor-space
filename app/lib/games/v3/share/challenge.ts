export interface ChallengeCreatePayload {
  gameSlug: string;
  seed: number;
  difficultyBand: number;
  mode: "daily" | "practice";
  uiVersion: string;
  curveVersion: string;
  stumbleText?: string | null;
}

export interface ChallengeCreateResponse {
  success: boolean;
  code: string;
  url: string;
}

export async function createChallenge(payload: ChallengeCreatePayload): Promise<ChallengeCreateResponse> {
  const response = await fetch("/api/games/challenges/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const parsed = await response.json().catch(() => null);
  if (!response.ok || !parsed?.success) {
    throw new Error("Failed to create challenge");
  }

  return parsed as ChallengeCreateResponse;
}
