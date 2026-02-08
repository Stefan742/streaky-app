// src/services/syncQueue.ts
type SyncTask = () => Promise<void>;

class SyncQueue {
  private queue: SyncTask[] = [];
  private isProcessing = false;
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  async enqueue(
    task: SyncTask,
    debounceKey?: string,
    debounceMs: number = 1000
  ): Promise<void> {
    if (debounceKey) {
      const existingTimer = this.debounceTimers.get(debounceKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          this.debounceTimers.delete(debounceKey);
          this.queue.push(task);
          this.processQueue();
          resolve();
        }, debounceMs);

        this.debounceTimers.set(debounceKey, timer);
      });
    } else {
      this.queue.push(task);
      return this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('Sync queue task error:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  clear(): void {
    this.queue = [];
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

export const syncQueue = new SyncQueue();
