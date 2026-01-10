const DEFAULT_JOIN_EARLY_MINUTES = 15;
const DEFAULT_JOIN_GRACE_MINUTES = 60;

function parseNonNegativeInt(value?: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function getJoinEarlyMinutes(): number {
  return (
    parseNonNegativeInt(process.env.NEXT_PUBLIC_LIVEKIT_JOIN_EARLY_MINUTES) ??
    DEFAULT_JOIN_EARLY_MINUTES
  );
}

export function getJoinGraceMinutes(): number {
  return (
    parseNonNegativeInt(process.env.NEXT_PUBLIC_LIVEKIT_JOIN_GRACE_MINUTES) ??
    DEFAULT_JOIN_GRACE_MINUTES
  );
}
