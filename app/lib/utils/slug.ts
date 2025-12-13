export const DEFAULT_MAX_SLUG_LENGTH = 96;

function stripDiacritics(input: string) {
  return input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeKebabSlug(
  input: string,
  options?: { maxLength?: number }
): string {
  const maxLength = options?.maxLength ?? DEFAULT_MAX_SLUG_LENGTH;
  const raw = stripDiacritics(String(input ?? "")).trim().toLowerCase();
  if (!raw) return "";

  const cleaned = raw
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!cleaned) return "";

  const limited = cleaned
    .slice(0, maxLength)
    .replace(/-+$/g, "")
    .replace(/^-+/g, "");

  return limited;
}

export function slugifyKebab(
  input: string,
  options?: { fallback?: string; maxLength?: number }
): string {
  const maxLength = options?.maxLength ?? DEFAULT_MAX_SLUG_LENGTH;
  const normalized = normalizeKebabSlug(input, { maxLength });
  if (normalized) return normalized;

  const fallback = options?.fallback ?? "";
  const normalizedFallback = normalizeKebabSlug(fallback, { maxLength });
  return normalizedFallback;
}

export function isKebabSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

