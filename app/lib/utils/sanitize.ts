const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  return Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null;
}

/**
 * Recursively clones an input value while stripping any prototype-polluting keys.
 * Preserves arrays and primitive values as-is.
 */
export function sanitizeInput<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeInput(item)) as unknown as T;
  }

  if (isPlainObject(value)) {
    const safeObject: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      safeObject[key] = sanitizeInput(child);
    }

    return safeObject as T;
  }

  return value;
}

/**
 * Parse a JSON body from a request and sanitize it against prototype pollution.
 */
export async function parseSanitizedJson<T extends Record<string, unknown> = Record<string, unknown>>(
  request: Request
): Promise<T | null> {
  try {
    const raw = await request.json();
    if (!isPlainObject(raw)) return null;
    return sanitizeInput(raw) as T;
  } catch {
    return null;
  }
}
