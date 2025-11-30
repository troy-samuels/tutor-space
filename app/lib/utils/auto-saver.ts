export type AutoSaverOptions = {
  debounceMs?: number;
  retries?: number;
  onSaving?: () => void;
  onSaved?: () => void;
  onError?: (error?: unknown) => void;
};

export class AutoSaver {
  private timer: NodeJS.Timeout | null = null;
  private lastTask: (() => Promise<boolean>) | null = null;
  private isRunning = false;
  private readonly debounceMs: number;
  private readonly retries: number;
  private readonly onSaving?: () => void;
  private readonly onSaved?: () => void;
  private readonly onError?: (error?: unknown) => void;

  constructor(options?: AutoSaverOptions) {
    this.debounceMs = options?.debounceMs ?? 2000;
    this.retries = options?.retries ?? 2;
    this.onSaving = options?.onSaving;
    this.onSaved = options?.onSaved;
    this.onError = options?.onError;
  }

  trigger(task: () => Promise<boolean>) {
    this.lastTask = task;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);
  }

  async flush() {
    if (this.isRunning || !this.lastTask) return;
    this.isRunning = true;
    const execute = this.lastTask;
    this.lastTask = null;
    this.onSaving?.();
    try {
      let attempt = 0;
      let ok = false;
      let error: unknown = undefined;
      while (attempt <= this.retries && !ok) {
        try {
          ok = await execute();
        } catch (err) {
          error = err;
          ok = false;
        }
        attempt++;
      }
      if (ok) {
        this.onSaved?.();
      } else {
        this.onError?.(error);
      }
    } finally {
      this.isRunning = false;
    }
  }
}



