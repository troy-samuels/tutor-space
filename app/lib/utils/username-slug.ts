import { isReservedUsername } from "@/lib/constants/reserved-usernames";

export const MAX_USERNAME_LENGTH = 80;
export const SIGNUP_MAX_USERNAME_LENGTH = 32;
export const MIN_USERNAME_LENGTH = 3;

function stripDiacritics(input: string) {
  // NFKD splits accented characters into base + combining marks.
  return input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeUsernameSlug(input: string): string {
  const raw = stripDiacritics(String(input ?? "")).trim().toLowerCase();
  if (!raw) return "";

  // Convert common separators to hyphens, then remove everything except a-z, 0-9, hyphen.
  const cleaned = raw
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_USERNAME_LENGTH)
    .replace(/^-+|-+$/g, "");

  return cleaned;
}

export function normalizeSignupUsername(input: string): string {
  const normalized = normalizeUsernameSlug(input);
  if (!normalized) return "";

  return normalized
    .slice(0, SIGNUP_MAX_USERNAME_LENGTH)
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function validateNormalizedUsernameSlug(
  normalized: string
): { valid: boolean; error?: string } {
  if (!normalized || normalized.length < MIN_USERNAME_LENGTH) {
    return { valid: false, error: `Username must be at least ${MIN_USERNAME_LENGTH} characters.` };
  }
  if (normalized.length > MAX_USERNAME_LENGTH) {
    return { valid: false, error: `Username must be ${MAX_USERNAME_LENGTH} characters or less.` };
  }
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return { valid: false, error: "Use lowercase letters, numbers, or hyphens." };
  }
  if (!/^[a-z0-9]/.test(normalized)) {
    return { valid: false, error: "Username must start with a letter or number." };
  }
  if (isReservedUsername(normalized)) {
    return { valid: false, error: "This username is reserved." };
  }
  return { valid: true };
}

export function normalizeAndValidateUsernameSlug(input: string): {
  normalized: string;
  valid: boolean;
  error?: string;
} {
  const normalized = normalizeUsernameSlug(input);
  const result = validateNormalizedUsernameSlug(normalized);
  return { normalized, ...result };
}

export function findFirstValidUsernameSlug(
  candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const result = normalizeAndValidateUsernameSlug(candidate);
    if (result.valid) {
      return result.normalized;
    }
  }
  return null;
}
