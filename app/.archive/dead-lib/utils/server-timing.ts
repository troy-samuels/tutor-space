/**
 * Server Timing Utility
 *
 * Measures and reports server-side performance metrics.
 * Results can be viewed in browser DevTools under Network > Timing.
 *
 * @example
 * ```ts
 * const timing = new ServerTiming();
 *
 * const user = await timing.measure('auth', () => supabase.auth.getUser());
 * const data = await timing.measure('data', () => fetchData());
 *
 * // In headers:
 * // Server-Timing: auth;dur=123, data;dur=456
 * console.log(timing.getHeader());
 * console.log(timing.getSummary()); // { auth: 123, data: 456, total: 579 }
 * ```
 */
export class ServerTiming {
  private metrics: Map<string, number> = new Map();
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Measure the execution time of an async function.
   * @param name - Metric name (alphanumeric + underscore)
   * @param fn - Async function to measure
   * @returns The result of the function
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.metrics.set(name, Math.round(duration * 100) / 100);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.metrics.set(`${name}_error`, Math.round(duration * 100) / 100);
      throw error;
    }
  }

  /**
   * Measure multiple async functions in parallel.
   * @param items - Array of [name, fn] tuples
   * @returns Array of results in same order
   */
  async measureAll<T extends readonly unknown[]>(
    items: { [K in keyof T]: [string, () => Promise<T[K]>] }
  ): Promise<T> {
    const results = await Promise.all(
      items.map(([name, fn]) => this.measure(name, fn))
    );
    return results as unknown as T;
  }

  /**
   * Add a manual metric (e.g., for sync operations).
   * @param name - Metric name
   * @param durationMs - Duration in milliseconds
   */
  addMetric(name: string, durationMs: number): void {
    this.metrics.set(name, Math.round(durationMs * 100) / 100);
  }

  /**
   * Get the Server-Timing header value.
   * Format: "name1;dur=123, name2;dur=456"
   */
  getHeader(): string {
    const entries: string[] = [];
    for (const [name, duration] of this.metrics) {
      entries.push(`${name};dur=${duration}`);
    }
    // Add total time
    const totalDuration = Math.round((performance.now() - this.startTime) * 100) / 100;
    entries.push(`total;dur=${totalDuration}`);
    return entries.join(", ");
  }

  /**
   * Get timing summary as an object.
   * Useful for logging or analytics.
   */
  getSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const [name, duration] of this.metrics) {
      summary[name] = duration;
    }
    summary.total = Math.round((performance.now() - this.startTime) * 100) / 100;
    return summary;
  }

  /**
   * Log timing summary to console.
   * @param prefix - Optional prefix for the log message
   */
  log(prefix: string = "[ServerTiming]"): void {
    const summary = this.getSummary();
    console.log(`${prefix} ${JSON.stringify(summary)}`);
  }

  /**
   * Reset all metrics and start time.
   */
  reset(): void {
    this.metrics.clear();
    this.startTime = performance.now();
  }
}

/**
 * Simple timing helper for one-off measurements.
 * @param name - Metric name for logging
 * @param fn - Async function to measure
 * @returns The result of the function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = Math.round((performance.now() - start) * 100) / 100;
    console.log(`[Timing] ${name}: ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Math.round((performance.now() - start) * 100) / 100;
    console.log(`[Timing] ${name} (error): ${duration}ms`);
    throw error;
  }
}
