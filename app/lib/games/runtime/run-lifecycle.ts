import type {
  GameRunCompletePayload,
  GameRunCompleteResponse,
  GameRunStartPayload,
  GameRunStartResponse,
} from "./types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const parsed = await response.json().catch(() => null);
  if (!response.ok || !parsed) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return parsed as T;
}

export async function startGameRun(payload: GameRunStartPayload): Promise<GameRunStartResponse> {
  return postJson<GameRunStartResponse>("/api/games/runs/start", payload);
}

export async function completeGameRun(payload: GameRunCompletePayload): Promise<GameRunCompleteResponse> {
  return postJson<GameRunCompleteResponse>("/api/games/runs/complete", payload);
}
